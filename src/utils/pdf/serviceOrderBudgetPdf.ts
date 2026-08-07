import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ServiceOrder } from '../../types'
import { displayPlaca } from '../masks'
import {
  formatCurrency,
  formatKm,
  formatServiceOrderDateTime,
  getServiceOrderStatusLabel,
} from '../serviceOrder'
import {
  drawDocumentHeader,
  drawFieldGrid,
  drawFooter,
  drawNoteBlock,
  drawPageBackground,
  drawSectionTitle,
  drawSignatureBlock,
  drawTotalsPanel,
  ensureSpace,
  fileSafe,
  getPageSize,
  tableTheme,
} from './pdfTheme'

export function downloadServiceOrderBudgetPdf(serviceOrder: ServiceOrder) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { height } = getPageSize(doc)

  drawPageBackground(doc)

  let y = drawDocumentHeader(doc, {
    title: 'Orçamento de Ordem de Serviço',
    subtitle: `${formatServiceOrderDateTime(serviceOrder.data, serviceOrder.hora)}  ·  ${getServiceOrderStatusLabel(serviceOrder.status)}`,
    metaRight: `OS #${serviceOrder.id}`,
  })

  y = drawSectionTitle(doc, 'Dados do atendimento', y)
  y +=
    drawFieldGrid(doc, y, [
      ['Proprietário', serviceOrder.clienteNome],
      ['Responsável', serviceOrder.tecnicoNome],
      ['Placa', displayPlaca(serviceOrder.veiculoPlaca)],
      ['Veículo', `${serviceOrder.veiculoMarca} ${serviceOrder.veiculoModelo}`],
      ['KM entrada', formatKm(serviceOrder.kmEntrada)],
      ['KM saída', formatKm(serviceOrder.kmSaida)],
    ]) + 8

  if (serviceOrder.diagnosticoInicial?.trim()) {
    y = ensureSpace(doc, y, 24)
    y = drawSectionTitle(doc, 'Diagnóstico', y)
    y += drawNoteBlock(doc, y, 'Relato / inspeção', serviceOrder.diagnosticoInicial.trim()) + 8
  }

  y = ensureSpace(doc, y, 36)
  y = drawSectionTitle(doc, 'Peças', y)

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descrição', 'Qtd.', 'Valor unitário', 'Total']],
    body:
      serviceOrder.itens.length > 0
        ? serviceOrder.itens.map((item, index) => [
            String(index + 1),
            item.descricao,
            item.quantidade.toLocaleString('pt-BR'),
            formatCurrency(item.valorUnitario),
            formatCurrency(item.valorTotal),
          ])
        : [['—', 'Nenhuma peça informada', '—', '—', '—']],
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  if (serviceOrder.descricaoMaoDeObra?.trim() || serviceOrder.descricaoServicosTerceirizados?.trim()) {
    y = ensureSpace(doc, y, 28)
    y = drawSectionTitle(doc, 'Observações', y)
    const notes: string[] = []
    if (serviceOrder.descricaoMaoDeObra?.trim()) {
      notes.push(`Mão de obra: ${serviceOrder.descricaoMaoDeObra.trim()}`)
    }
    if (serviceOrder.descricaoServicosTerceirizados?.trim()) {
      notes.push(`Serviços terceirizados: ${serviceOrder.descricaoServicosTerceirizados.trim()}`)
    }
    y += drawNoteBlock(doc, y, 'Detalhamento', notes.join('\n')) + 8
  }

  y = ensureSpace(doc, y, 40)
  y = drawSectionTitle(doc, 'Resumo financeiro', y)
  y +=
    drawTotalsPanel(
      doc,
      y,
      [
        ['Serviços terceirizados', formatCurrency(serviceOrder.custoServicosTerceirizados)],
        ['Peças', formatCurrency(serviceOrder.custoPecas)],
        ['Mão de obra', formatCurrency(serviceOrder.custoMaoDeObra)],
      ],
      'Total',
      formatCurrency(serviceOrder.precoTotal),
    ) + 10

  // Reserva a assinatura no final da página (ou nova página se não couber)
  const signatureHeight = 48
  const footerReserve = 18
  if (y + signatureHeight + 6 > height - footerReserve) {
    doc.addPage()
    drawPageBackground(doc)
    y = 20
  }
  y = drawSectionTitle(doc, 'Autorização', y)
  drawSignatureBlock(doc, y)

  drawFooter(doc, 'Vortex MEC · Orçamento para assinatura do cliente')

  doc.save(`orcamento-os-${serviceOrder.id}-${fileSafe(serviceOrder.veiculoPlaca)}.pdf`)
}
