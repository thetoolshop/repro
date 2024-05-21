import { tapF } from '@repro/future-utils'
import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  FutureInstance,
  bichain,
  both,
  chain,
  map,
  mapRej,
  reject,
  resolve,
} from 'fluture'
import z from 'zod'
import { defaultSystemConfig } from '~/config/system'
import { AccountService } from '~/services/account'
import { isNotFound, notAuthenticated, resourceConflict } from '~/utils/errors'
import { createResponseUtils } from '~/utils/response'

export function createAccountRouter(
  accountService: AccountService,
  config = defaultSystemConfig
): FastifyPluginAsync {
  const { respondWith } = createResponseUtils(config)

  function ensureUserDoesNotExist(email: string): FutureInstance<Error, void> {
    return accountService
      .getUserByEmail(email)
      .pipe(
        bichain<Error, Error, void>(error =>
          isNotFound(error) ? resolve(undefined) : reject(error)
        )(() => reject(resourceConflict()))
      )
  }

  return async function (fastify) {
    const app = fastify.withTypeProvider<ZodTypeProvider>()

    app.post(
      '/register',

      {
        schema: {
          body: z.object({
            accountName: z.string(),
            userName: z.string(),
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },

      (req, res) => {
        respondWith(
          res,
          ensureUserDoesNotExist(req.body.email).pipe(
            chain(() =>
              accountService
                .createAccount(req.body.accountName)
                .pipe(
                  chain(account =>
                    accountService
                      .createUser(
                        account.id,
                        req.body.userName,
                        req.body.email,
                        req.body.password
                      )
                      .pipe(map(user => ({ account, user })))
                  )
                )
            )
          ),
          201
        )
      }
    )

    app.post(
      '/invite',

      {
        schema: {
          body: z.object({
            email: z.string().email(),
          }),
        },
      },

      (req, res) => {
        const currentUser = req.getCurrentUser()

        const account = currentUser.pipe(
          chain(user =>
            accountService
              .ensureUser(user)
              .pipe(() => accountService.getAccountForUser(user.id))
          )
        )

        const invitation = both(currentUser)(account).pipe(
          chain(([user, account]) =>
            accountService
              .ensureCanModifyAccount(user, account.id)
              .pipe(
                chain(() =>
                  accountService.createInvitation(account.id, req.body.email)
                )
              )
          )
        )

        // TODO: enqueue email to invitee
        //
        // respondWith(
        //   res,
        //   invitation.pipe(
        //     tapF(payload =>
        //       queueService.enqueue({
        //         task: 'send-invitation',
        //         invitationId: payload.id
        //       })
        //     )
        //   )
        // )

        respondWith(
          res,
          ensureUserDoesNotExist(req.body.email).pipe(chain(() => invitation)),
          201
        )
      }
    )

    app.post(
      '/accept-invitation',

      {
        schema: {
          body: z.object({
            invitationToken: z.string(),
            name: z.string(),
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },

      (req, res) => {
        const { invitationToken, name, email, password } = req.body

        respondWith(
          res,
          accountService
            .getInvitationByTokenAndEmail(invitationToken, email)
            .pipe(
              chain(invitation =>
                accountService.getAccountForInvitation(invitation.id)
              )
            )
            .pipe(
              chain(account =>
                accountService.createUser(account.id, name, email, password)
              )
            ),
          201
        )
      }
    )

    app.post(
      '/login',

      {
        schema: {
          body: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },

      (req, res) => {
        respondWith(
          res,
          accountService
            .getUserByEmailAndPassword(req.body.email, req.body.password)
            .pipe(
              mapRej(error => (isNotFound(error) ? notAuthenticated() : error))
            )
            .pipe(tapF(user => req.createSession(user)))
        )
      }
    )

    app.post('/logout', (req, res) => {
      respondWith(res, req.revokeSession())
    })

    app.post(
      '/verify',

      {
        schema: {
          body: z.object({
            verificationToken: z.string(),
            email: z.string().email(),
          }),
        },
      },

      (req, res) => {
        const ensureCurrentUserMatchesEmail = req
          .getCurrentUser()
          .pipe(
            chain(currentUser =>
              accountService.ensureUserMatchesEmail(currentUser, req.body.email)
            )
          )

        respondWith(
          res,
          ensureCurrentUserMatchesEmail.pipe(
            chain(() =>
              accountService.verifyUser(
                req.body.verificationToken,
                req.body.email
              )
            )
          )
        )
      }
    )

    app.get('/me', (req, res) => {
      respondWith(res, req.getCurrentUser())
    })
  }
}
