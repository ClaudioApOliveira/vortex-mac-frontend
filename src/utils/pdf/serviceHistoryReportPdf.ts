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
  PDF,
  drawDocumentHeader,
  drawFieldGrid,
  drawFooter,
  drawNoteBlock,
  drawPageBackground,
  drawSectionTitle,
  drawTotalsPanel,
  ensureSpace,
  fileSafe,
  formatDateBr,
  getPageSize,
  tableTheme,
} from './pdfTheme'

export interface ServiceHistoryReportOptions {
  clientName: string
  orders: ServiceOrder[]
  vehicleLabel?: string
  dataInicio?: string
  dataFim?: string
  statusLabel?: string
}

function drawOrderDetail(doc: jsPDF, order: ServiceOrder, startY: number) {
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)
  let y = startY

  y = ensureSpace(doc, y, 55)
  y = drawSectionTitle(doc, `OS #${order.id} — ${getServiceOrderStatusLabel(order.status)}`, y)

  y +=
    drawFieldGrid(doc, y, [
      ['Data / hora', formatServiceOrderDateTime(order.data, order.hora)],
      ['Responsável', order.tecnicoNome],
      ['Placa', displayPlaca(order.veiculoPlaca)],
      ['Veículo', `${order.veiculoMarca} ${order.veiculoModelo}`],
      ['KM entrada', formatKm(order.kmEntrada)],
      ['KM saída', formatKm(order.kmSaida)],
    ]) + 6

  if (order.diagnosticoInicial?.trim()) {
    y = ensureSpace(doc, y, 22)
    y += drawNoteBlock(doc, y, 'Diagnóstico', order.diagnosticoInicial.trim()) + 6
  }

  y = ensureSpace(doc, y, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...colors.muted)
  doc.text('PEÇAS', margin, y)
  y += 3

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descrição', 'Qtd.', 'Valor unit.', 'Total']],
    body:
      order.itens.length > 0
        ? order.itens.map((item, index) => [
            String(index + 1),
            item.descricao,
            item.quantidade.toLocaleString('pt-BR'),
            formatCurrency(item.valorUnitario),
            formatCurrency(item.valorTotal),
          ])
        : [['—', 'Nenhuma peça registrada', '—', '—', '—']],
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  if (order.descricaoMaoDeObra?.trim() || order.descricaoServicosTerceirizados?.trim()) {
    y = ensureSpace(doc, y, 22)
    const notes: string[] = []
    if (order.descricaoMaoDeObra?.trim()) {
      notes.push(`Mão de obra: ${order.descricaoMaoDeObra.trim()}`)
    }
    if (order.descricaoServicosTerceirizados?.trim()) {
      notes.push(`Serviços terceirizados: ${order.descricaoServicosTerceirizados.trim()}`)
    }
    y += drawNoteBlock(doc, y, 'Observações', notes.join('\n')) + 5
  }

  y = ensureSpace(doc, y, 32)
  y +=
    drawTotalsPanel(
      doc,
      y,
      [
        ['Serviços terceirizados', formatCurrency(order.custoServicosTerceirizados)],
        ['Peças', formatCurrency(order.custoPecas)],
        ['Mão de obra', formatCurrency(order.custoMaoDeObra)],
      ],
      'Total OS',
      formatCurrency(order.precoTotal),
    ) + 4

  doc.setDrawColor(...colors.line)
  doc.setLineWidth(0.3)
  doc.line(margin, y + 2, width - margin, y + 2)

  return y + 8
}

export function downloadServiceHistoryReportPdf(options: ServiceHistoryReportOptions) {
  const { clientName, orders, vehicleLabel, dataInicio, dataFim, statusLabel } = options
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)

  drawPageBackground(doc)

  let y = drawDocumentHeader(doc, {
    title: 'Relatório detalhado de OS',
    subtitle: `Emitido em ${new Date().toLocaleString('pt-BR')}`,
    metaRight: `${orders.length} OS`,
  })

  y = drawSectionTitle(doc, 'Parâmetros', y)
  y +=
    drawFieldGrid(doc, y, [
      ['Cliente', clientName],
      ['Status', statusLabel ?? 'Todos'],
      ['Veículo', vehicleLabel ?? 'Todos'],
      ['Período', `${formatDateBr(dataInicio)} — ${formatDateBr(dataFim)}`],
    ]) + 6

  const totalGeral = orders.reduce((sum, order) => sum + order.precoTotal, 0)

  if (orders.length === 0) {
    doc.setDrawColor(...colors.border)
    doc.setFillColor(...colors.surface)
    doc.rect(margin, y, width - margin * 2, 18, 'FD')
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...colors.muted)
    doc.text('Nenhuma ordem de serviço encontrada para os filtros informados.', width / 2, y + 11, {
      align: 'center',
    })
  } else {
    y = drawSectionTitle(doc, 'Resumo', y)

    autoTable(doc, {
      startY: y,
      head: [['OS', 'Data', 'Veículo', 'Status', 'Total']],
      body: orders.map((order) => [
        `#${order.id}`,
        formatServiceOrderDateTime(order.data, order.hora),
        `${displayPlaca(order.veiculoPlaca)}`,
        getServiceOrderStatusLabel(order.status),
        formatCurrency(order.precoTotal),
      ]),
      ...tableTheme,
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' },
        1: { cellWidth: 36 },
        2: { cellWidth: 28 },
        3: { cellWidth: 30 },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
    y +=
      drawTotalsPanel(
        doc,
        y,
        [['Quantidade de OS', String(orders.length)]],
        'Total geral',
        formatCurrency(totalGeral),
      ) + 8

    y = drawSectionTitle(doc, 'Detalhamento por ordem de serviço', y)

    for (const order of orders) {
      y = drawOrderDetail(doc, order, y)
    }
  }

  drawFooter(doc, 'Vortex MEC · Relatório detalhado de ordens de serviço do cliente')

  const suffix = vehicleLabel ? `-${fileSafe(vehicleLabel)}` : ''
  doc.save(`relatorio-detalhado-os${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
