import { attempt, attemptP, FutureInstance, go } from 'fluture'
import { readFile } from 'fs/promises'
import Handlebars from 'handlebars'
import { Transporter } from 'nodemailer'
import path from 'path'

export interface EmailConfig {
  fromEmail: string
  templateDirectory: string
}

export interface EmailUtils {
  sendEmail(
    templateName: string,
    email: string,
    templateContext: Record<string, string>
  ): FutureInstance<Error, void>
}

export function createEmailUtils(
  transporter: Transporter,
  config: EmailConfig
): EmailUtils {
  function sendEmail(
    templateName: string,
    email: string,
    templateContext: Record<string, string>
  ): FutureInstance<Error, void> {
    return go(function* () {
      const subject: Buffer = yield attemptP(() =>
        readFile(path.join(config.templateDirectory, `${templateName}/subject`))
      )

      const template: Buffer = yield attemptP(() =>
        readFile(
          path.join(config.templateDirectory, `${templateName}/body.hbs`)
        )
      )

      const body = yield attempt(() =>
        Handlebars.compile(template.toString())(templateContext)
      )

      yield attemptP(() =>
        transporter.sendMail({
          to: email,
          from: config.fromEmail,
          subject: subject.toString(),
          html: body,
        })
      )
    })
  }

  return {
    sendEmail,
  }
}
