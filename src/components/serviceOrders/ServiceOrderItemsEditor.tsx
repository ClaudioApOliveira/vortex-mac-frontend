import type { ServiceOrderItemFormData } from '../../schemas/serviceOrder.schema'
import { formatMoneyInput } from '../../utils/masks'
import './ServiceOrderItemsEditor.css'

type ItemErrors = Partial<Record<keyof ServiceOrderItemFormData, string>>

interface ServiceOrderItemsEditorProps {
  itens: ServiceOrderItemFormData[]
  errors?: Record<number, ItemErrors>
  onChange: (index: number, field: keyof ServiceOrderItemFormData, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function ServiceOrderItemsEditor({
  itens,
  errors = {},
  onChange,
  onAdd,
  onRemove,
}: ServiceOrderItemsEditorProps) {
  return (
    <div className="os-items">
      <div className="os-items-header">
        <h3>Peças e serviços</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
          + Adicionar item
        </button>
      </div>

      <div className="os-items-table-wrap">
        <table className="os-items-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Quant.</th>
              <th>R$ unit.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {itens.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={(e) => onChange(index, 'descricao', e.target.value)}
                    placeholder="Filtro de óleo, troca de óleo..."
                    className={errors[index]?.descricao ? 'input-error' : undefined}
                  />
                  {errors[index]?.descricao && (
                    <span className="field-error">{errors[index].descricao}</span>
                  )}
                </td>
                <td>
                  <select
                    value={item.tipo}
                    onChange={(e) => onChange(index, 'tipo', e.target.value)}
                    className={errors[index]?.tipo ? 'input-error' : undefined}
                  >
                    <option value="PECA">Peça</option>
                    <option value="SERVICO">Serviço</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.quantidade}
                    onChange={(e) => onChange(index, 'quantidade', e.target.value)}
                    className={errors[index]?.quantidade ? 'input-error' : undefined}
                  />
                  {errors[index]?.quantidade && (
                    <span className="field-error">{errors[index].quantidade}</span>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.valorUnitario}
                    onChange={(e) =>
                      onChange(index, 'valorUnitario', formatMoneyInput(e.target.value))
                    }
                    placeholder="0,00"
                    className={errors[index]?.valorUnitario ? 'input-error' : undefined}
                  />
                  {errors[index]?.valorUnitario && (
                    <span className="field-error">{errors[index].valorUnitario}</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => onRemove(index)}
                    disabled={itens.length === 1}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
