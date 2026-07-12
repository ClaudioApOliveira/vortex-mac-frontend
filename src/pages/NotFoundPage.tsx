import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/paths'
import './NotFoundPage.css'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found-title">Página não encontrada</h1>
        <p className="not-found-message">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <div className="not-found-actions">
          <Link to={ROUTES.home} className="btn btn-primary">
            <Home aria-hidden="true" />
            Ir para o início
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
