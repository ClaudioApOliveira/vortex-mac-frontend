import { Link } from 'react-router-dom'
import { Logo } from '../../components/ui/Logo'
import { LGPD_POLICY_UPDATED_AT, LGPD_POLICY_VERSION } from '../../constants/lgpd'
import { ROUTES } from '../../routes/paths'
import './PrivacyPolicyPage.css'

export function PrivacyPolicyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-shell">
        <header className="privacy-brand">
          <Logo variant="full" />
        </header>

        <article className="privacy-card">
          <header className="privacy-header">
            <h1>Política de Privacidade</h1>
            <p>
              Versão {LGPD_POLICY_VERSION} · Atualizada em{' '}
              {new Date(`${LGPD_POLICY_UPDATED_AT}T12:00:00`).toLocaleDateString('pt-BR')}
            </p>
          </header>

          <section>
            <h2>1. Quem somos</h2>
            <p>
              Este sistema é utilizado pela oficina para gestão de clientes, veículos e
              ordens de serviço. O tratamento dos dados pessoais observa a Lei Geral de
              Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2>2. Quais dados coletamos</h2>
            <ul>
              <li>
                <strong>Cadastro:</strong> nome, CPF ou CNPJ, telefone, endereço e e-mail
                de acesso.
              </li>
              <li>
                <strong>Veículos:</strong> placa, marca, modelo, ano e demais dados
                técnicos informados no atendimento.
              </li>
              <li>
                <strong>Ordens de serviço:</strong> diagnóstico, peças, valores, quilometragem
                e histórico de status do atendimento.
              </li>
              <li>
                <strong>Conta:</strong> e-mail, senha (armazenada de forma criptografada) e
                perfil de acesso.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Para que usamos</h2>
            <ul>
              <li>Prestação e acompanhamento dos serviços da oficina.</li>
              <li>Emissão de orçamentos, aprovações e registros do atendimento.</li>
              <li>Comunicação sobre o andamento da ordem de serviço.</li>
              <li>Segurança da conta e prevenção a uso indevido.</li>
              <li>Cumprimento de obrigações legais e regulatórias, quando aplicável.</li>
            </ul>
          </section>

          <section>
            <h2>4. Bases legais</h2>
            <p>
              Em regra, tratamos os dados para execução de contrato ou procedimentos
              preliminares (orçamento e OS), cumprimento de obrigação legal e legítimo
              interesse da oficina na gestão segura do atendimento — sempre com respeito
              aos seus direitos.
            </p>
          </section>

          <section>
            <h2>5. Compartilhamento</h2>
            <p>
              Não vendemos seus dados. Podemos utilizar serviços de infraestrutura
              (hospedagem, segurança e consulta de CEP) estritamente necessários ao
              funcionamento do sistema, sob contratos e medidas de proteção adequadas.
            </p>
          </section>

          <section>
            <h2>6. Seus direitos</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul>
              <li>Confirmar a existência de tratamento e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a portabilidade dos dados (exportação).</li>
              <li>Solicitar anonimização ou exclusão, quando cabível.</li>
              <li>Obter informações sobre o tratamento e compartilhamento.</li>
            </ul>
            <p>
              Na área logada, em <strong>Meu perfil</strong>, você encontra opções para
              exportar seus dados e solicitar exclusão/anonimização.
            </p>
          </section>

          <section>
            <h2>7. Retenção</h2>
            <p>
              Mantemos os dados pelo tempo necessário ao atendimento e a obrigações
              legais/fiscais. Quando a exclusão não for possível (por exemplo, histórico
              de OS), podemos anonimizar os dados pessoais identificáveis.
            </p>
          </section>

          <section>
            <h2>8. Segurança</h2>
            <p>
              Adotamos medidas técnicas e administrativas razoáveis, incluindo autenticação
              com senha criptografada, controle de acesso por perfil e comunicação protegida.
            </p>
          </section>

          <section>
            <h2>9. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, fale com a
              oficina pelo canal de atendimento habitual ou pelo responsável pelo tratamento
              de dados indicado no estabelecimento.
            </p>
          </section>

          <footer className="privacy-footer">
            <Link to={ROUTES.login} className="btn btn-secondary">
              Voltar ao login
            </Link>
            <Link to={ROUTES.home} className="btn btn-secondary">
              Ir ao início
            </Link>
          </footer>
        </article>
      </div>
    </div>
  )
}
