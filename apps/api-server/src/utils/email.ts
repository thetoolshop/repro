import sendGrid from '@sendgrid/mail'
import { attempt, attemptP, FutureInstance, go } from 'fluture'
import { readFile } from 'fs/promises'
import Handlebars from 'handlebars'
import path from 'path'

export interface EmailConfig {
  fromEmail: string
  sendGridApiKey: string
  templateDirectory: string
}

export interface EmailUtils {
  sendEmail(
    templateName: string,
    email: string,
    templateContext: Record<string, string>
  ): FutureInstance<Error, void>
}

export function createEmailUtils(config: EmailConfig): EmailUtils {
  sendGrid.setApiKey(config.sendGridApiKey)

  function sendEmail(
    templateName: string,
    email: string,
    templateContext: Record<string, string>
  ): FutureInstance<Error, void> {
    return go(function* () {
      const subject = yield attemptP(() =>
        readFile(path.join(config.templateDirectory, `${templateName}/subject`))
      )

      const template = yield attemptP(() =>
        readFile(
          path.join(config.templateDirectory, `${templateName}/body.hbs`)
        )
      )

      const body = yield attempt(() =>
        Handlebars.compile(template)(templateContext)
      )

      yield attemptP(() =>
        sendGrid.send({
          to: email,
          from: config.fromEmail,
          subject,
          html: body,
        })
      )
    })
  }

  return {
    sendEmail,
  }
}
