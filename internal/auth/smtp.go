package auth

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"net/smtp"
	"text/template"
	"time"

	"go.uber.org/zap"
)

// SMTPConfig contains configuration for the SMTP server
type SMTPConfig struct {
	Host         string `yaml:"host"`
	Port         int    `yaml:"port"`
	Username     string `yaml:"username"`
	Password     string `yaml:"password"`
	FromEmail    string `yaml:"from_email"`
	FromName     string `yaml:"from_name"`
	UseTLS       bool   `yaml:"use_tls"`
	TemplatesDir string `yaml:"templates_dir"`
	AppDomain    string `yaml:"app_domain"` // Domain for links in emails
}

// EmailProvider handles sending emails for authentication purposes
type EmailProvider struct {
	config SMTPConfig
	logger *zap.Logger
}

// NewEmailProvider creates a new email provider
func NewEmailProvider(config SMTPConfig, logger *zap.Logger) *EmailProvider {
	return &EmailProvider{
		config: config,
		logger: logger,
	}
}

// SendPasswordReset sends a password reset email
func (p *EmailProvider) SendPasswordReset(email, token string, expiresAt time.Time) error {
	subject := "Redefinição de Senha - VeloFlux"
	templateStr := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4338ca; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; background-color: #4338ca; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VeloFlux - Redefinição de Senha</h1>
        </div>
        <div class="content">
            <p>Você solicitou a redefinição da sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
            <p><a class="button" href="{{.ResetURL}}">Redefinir Senha</a></p>
            <p>Se você não solicitou a redefinição da senha, por favor ignore este email.</p>
            <p>Atenciosamente,<br>Equipe VeloFlux</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
        </div>
    </div>
</body>
</html>
`
	// Create the reset URL (frontend would handle this)
	domain := p.config.AppDomain
	if domain == "" {
		domain = "veloflux.io"
	}
	resetURL := fmt.Sprintf("https://%s/reset-password?token=%s", domain, token)
	
	// Prepare template data
	data := struct {
		ResetURL string
		ExpiresAt string
	}{
		ResetURL: resetURL,
		ExpiresAt: expiresAt.Format("02/01/2006 15:04"),
	}
	
	// Execute the template
	var body bytes.Buffer
	tmpl, err := template.New("resetPassword").Parse(templateStr)
	if err != nil {
		p.logger.Error("Failed to parse email template", zap.Error(err))
		return err
	}
	
	if err := tmpl.Execute(&body, data); err != nil {
		p.logger.Error("Failed to execute email template", zap.Error(err))
		return err
	}
	
	// Send the email
	return p.sendEmail(email, subject, body.String())
}

// SendVerificationEmail sends an email verification link
func (p *EmailProvider) SendVerificationEmail(email, token string) error {
	subject := "Verificação de Email - VeloFlux"
	templateStr := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4338ca; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; background-color: #4338ca; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VeloFlux - Verificação de Email</h1>
        </div>
        <div class="content">
            <p>Obrigado por se registrar no VeloFlux!</p>
            <p>Por favor, clique no botão abaixo para verificar seu endereço de email:</p>
            <p><a class="button" href="{{.VerificationURL}}">Verificar Email</a></p>
            <p>Se você não se registrou no VeloFlux, por favor ignore este email.</p>
            <p>Atenciosamente,<br>Equipe VeloFlux</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
        </div>
    </div>
</body>
</html>
`
	// Create the verification URL (frontend would handle this)
	domain := p.config.AppDomain
	if domain == "" {
		domain = "veloflux.io"
	}
	verificationURL := fmt.Sprintf("https://%s/verify-email?token=%s", domain, token)
	
	// Prepare template data
	data := struct {
		VerificationURL string
	}{
		VerificationURL: verificationURL,
	}
	
	// Execute the template
	var body bytes.Buffer
	tmpl, err := template.New("verifyEmail").Parse(templateStr)
	if err != nil {
		p.logger.Error("Failed to parse email template", zap.Error(err))
		return err
	}
	
	if err := tmpl.Execute(&body, data); err != nil {
		p.logger.Error("Failed to execute email template", zap.Error(err))
		return err
	}
	
	// Send the email
	return p.sendEmail(email, subject, body.String())
}

// SendWelcomeEmail sends a welcome email to new users
func (p *EmailProvider) SendWelcomeEmail(email, firstName, tenantName string) error {
	subject := "Bem-vindo ao VeloFlux!"
	templateStr := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4338ca; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; background-color: #4338ca; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bem-vindo ao VeloFlux!</h1>
        </div>
        <div class="content">
            <p>Olá {{.FirstName}},</p>
            <p>Bem-vindo à plataforma VeloFlux! Seu cadastro para o tenant <strong>{{.TenantName}}</strong> foi concluído com sucesso.</p>
            <p>Com o VeloFlux, você poderá gerenciar facilmente o seu balanceador de carga, configurar rotas, monitorar performance e muito mais.</p>
            <p>Para começar, acesse o painel de controle:</p>
            <p><a class="button" href="https://{{.DashboardURL}}">Acessar Painel</a></p>
            <p>Se você tiver dúvidas, por favor consulte nossa documentação ou entre em contato com nosso suporte.</p>
            <p>Atenciosamente,<br>Equipe VeloFlux</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
        </div>
    </div>
</body>
</html>
`
	// Prepare template data
	domain := p.config.AppDomain
	if domain == "" {
		domain = "veloflux.io"
	}
	
	data := struct {
		FirstName    string
		TenantName   string
		DashboardURL string
	}{
		FirstName:    firstName,
		TenantName:   tenantName,
		DashboardURL: fmt.Sprintf("%s/dashboard", domain),
	}
	
	// Execute the template
	var body bytes.Buffer
	tmpl, err := template.New("welcome").Parse(templateStr)
	if err != nil {
		p.logger.Error("Failed to parse email template", zap.Error(err))
		return err
	}
	
	if err := tmpl.Execute(&body, data); err != nil {
		p.logger.Error("Failed to execute email template", zap.Error(err))
		return err
	}
	
	// Send the email
	return p.sendEmail(email, subject, body.String())
}

// SendTestEmail sends a test email to verify SMTP configuration
func (p *EmailProvider) SendTestEmail(email string) error {
	subject := "VeloFlux SMTP Test"
	templateStr := `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4338ca; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VeloFlux - Teste de SMTP</h1>
        </div>
        <div class="content">
            <p>Este é um email de teste para verificar as configurações de SMTP do VeloFlux.</p>
            <p>Se você está recebendo este email, as configurações de SMTP estão corretas!</p>
            <p>Detalhes da configuração:</p>
            <ul>
                <li>Servidor: {{.Host}}</li>
                <li>Porta: {{.Port}}</li>
                <li>TLS: {{.UseTLS}}</li>
                <li>De: {{.FromEmail}}</li>
                <li>Data e Hora do Teste: {{.DateTime}}</li>
            </ul>
            <p>Atenciosamente,<br>Equipe VeloFlux</p>
        </div>
        <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
        </div>
    </div>
</body>
</html>
`

	// Prepare template data
	data := struct {
		Host      string
		Port      int
		UseTLS    bool
		FromEmail string
		DateTime  string
	}{
		Host:      p.config.Host,
		Port:      p.config.Port,
		UseTLS:    p.config.UseTLS,
		FromEmail: p.config.FromEmail,
		DateTime:  time.Now().Format("02/01/2006 15:04:05"),
	}
	
	// Execute the template
	var body bytes.Buffer
	tmpl, err := template.New("testEmail").Parse(templateStr)
	if err != nil {
		p.logger.Error("Failed to parse email template", zap.Error(err))
		return err
	}
	
	if err := tmpl.Execute(&body, data); err != nil {
		p.logger.Error("Failed to execute email template", zap.Error(err))
		return err
	}
	
	// Send the email
	return p.sendEmail(email, subject, body.String())
}

// sendEmail sends an email using the configured SMTP server
func (p *EmailProvider) sendEmail(to, subject, htmlBody string) error {
	from := fmt.Sprintf("%s <%s>", p.config.FromName, p.config.FromEmail)
	
	// Setup headers
	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	// Construct message
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + htmlBody

	// SMTP connection details
	addr := fmt.Sprintf("%s:%d", p.config.Host, p.config.Port)
	auth := smtp.PlainAuth("", p.config.Username, p.config.Password, p.config.Host)

	// Send email
	var err error
	if p.config.UseTLS {
		// Configure TLS settings
		tlsConfig := &tls.Config{
			ServerName: p.config.Host,
		}

		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			p.logger.Error("Failed to connect to SMTP server with TLS", zap.Error(err))
			return err
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, p.config.Host)
		if err != nil {
			p.logger.Error("Failed to create SMTP client with TLS", zap.Error(err))
			return err
		}
		defer client.Close()

		if err = client.Auth(auth); err != nil {
			p.logger.Error("SMTP authentication failed", zap.Error(err))
			return err
		}

		if err = client.Mail(p.config.FromEmail); err != nil {
			p.logger.Error("Failed to set sender", zap.Error(err))
			return err
		}

		if err = client.Rcpt(to); err != nil {
			p.logger.Error("Failed to set recipient", zap.Error(err))
			return err
		}

		w, err := client.Data()
		if err != nil {
			p.logger.Error("Failed to open data writer", zap.Error(err))
			return err
		}

		_, err = w.Write([]byte(message))
		if err != nil {
			p.logger.Error("Failed to write email message", zap.Error(err))
		}

		err = w.Close()
		if err != nil {
			p.logger.Error("Failed to close data writer", zap.Error(err))
			return err
		}

		return client.Quit()
	} else {
		// Send without TLS
		err = smtp.SendMail(addr, auth, p.config.FromEmail, []string{to}, []byte(message))
		if err != nil {
			p.logger.Error("Failed to send email", zap.Error(err))
		}
		return err
	}
}
