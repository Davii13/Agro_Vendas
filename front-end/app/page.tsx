"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LogoutButton } from "@/components/LogoutButton"
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog"
import { UsersPanel } from "@/components/UsersPanel"
import { gerarHistoricoClienteHtml } from "@/lib/customerHistoryHtml"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Trash2,
  BarChart3,
  UserCircle,
  Edit,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Truck,
  RotateCcw,
  Printer,
  Download,
  FileDown,
  Menu,
  Apple,
  MinusCircle,
  ShieldCheck,
} from "lucide-react"
import * as XLSX from "xlsx"
import { apiCall } from "@/lib/api"

// Frontend Types matching Backend DTOs & Models
type ProductItem = {
  nome: string
  qtde: number
  valor: number
}

type Sale = {
  id?: number
  data: string
  cliente: string
  clienteId?: number | null
  modeloCaixa: string
  qtdeCaixas6424: number
  caixasPagasVale: number
  caixasDevendoVale: number
  pagamentoVerduras: string
  valorPago: number
  mercadorias: ProductItem[]
}

type Customer = {
  id: number
  nome: string
  telefone?: string | null
  cpfCnpj?: string | null
  localizacao?: string | null
  observacoes?: string | null
}

type CustomerDetails = { cliente: Customer; vendas: Sale[] }

type DeliveryProduct = {
  nomeMercadoria: string
  quantidadeCaixa6424: number
  quantidadePapelao: number
}

type Delivery = {
  id?: number
  data: string
  valorTotal?: number
  valorPago?: number
  valesPagos?: number
  mercadorias: DeliveryProduct[]
}

type Merchandise = {
  id: number
  nome: string
}

type Supplier = {
  id: number
  nome: string
  areaCeasa: string
}

const brl = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

// The server explains why it refused something (invalid value, unknown product...). Show that, not a generic error.
async function mensagemDoServidor(res: Response, padrao: string): Promise<string> {
  const corpo = await res.json().catch(() => null)
  return corpo?.erro || padrao
}

const saleTotal = (sale: Sale) => sale.mercadorias.reduce((sum, m) => sum + m.qtde * m.valor, 0)

// A sale can be recorded now and priced later; until then it has no total.
const precoPendente = (sale: Sale) => saleTotal(sale) <= 0

// State is always text plus icon, never color alone.
function PaymentStatus({ sale }: { sale: Sale }) {
  if (precoPendente(sale)) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
        <MinusCircle className="h-4 w-4" aria-hidden /> Aguardando preço
      </span>
    )
  }
  if (sale.pagamentoVerduras === "Pago") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden /> Pago
      </span>
    )
  }
  if (sale.pagamentoVerduras === "Parcial") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
        <MinusCircle className="h-4 w-4" aria-hidden /> Parcial
        <span className="tabular-nums font-medium">{brl(sale.valorPago)}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
      <AlertCircle className="h-4 w-4" aria-hidden /> Devendo
    </span>
  )
}

function BoxVale({ sale, showModel = false, onReturn }: { sale: Sale; showModel?: boolean; onReturn?: () => void }) {
  if (sale.modeloCaixa === "Papelão") {
    return showModel ? <p className="text-slate-700">Caixa Papelão</p> : <span className="text-slate-400">&ndash;</span>
  }
  return (
    <div>
      {showModel && <p className="font-medium text-slate-900">Caixa {sale.modeloCaixa}</p>}
      <p className="text-slate-700">
        <span className="tabular-nums font-medium">{sale.caixasPagasVale}</span> de{" "}
        <span className="tabular-nums font-medium">{sale.qtdeCaixas6424}</span> pagas
      </p>
      {sale.caixasDevendoVale > 0 ? (
        <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-red-700">
          <AlertCircle className="h-4 w-4" aria-hidden /> Devendo {sale.caixasDevendoVale}
        </p>
      ) : (
        <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Tudo devolvido
        </p>
      )}
      {onReturn && sale.caixasDevendoVale > 0 && (
        <Button variant="outline" size="sm" onClick={onReturn} className="mt-2">
          Devolver vales
        </Button>
      )}
    </div>
  )
}

const deliveryVales = (d: Delivery) => d.mercadorias.reduce((s, m) => s + m.quantidadeCaixa6424, 0)

// Money and vales owed to a producer: text and icon carry the state, color only reinforces it.
function DeliveryPayment({ delivery }: { delivery: Delivery }) {
  const total = delivery.valorTotal || 0
  const pago = delivery.valorPago || 0
  const vales = deliveryVales(delivery)
  const valesPagos = delivery.valesPagos || 0
  const dinheiroOk = total > 0 && pago >= total
  const valesOk = vales === 0 || valesPagos >= vales
  const quitado = dinheiroOk && valesOk
  const Mark = ({ ok }: { ok: boolean }) =>
    ok ? (
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
    ) : (
      <AlertCircle className="h-4 w-4 shrink-0 text-red-700" aria-hidden />
    )
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5">
        <Mark ok={dinheiroOk} />
        <span className="font-semibold tabular-nums text-slate-900">{brl(pago)}</span>
        <span className="text-slate-600">de {brl(total)}</span>
      </p>
      <p className="flex items-center gap-1.5">
        <Mark ok={valesOk} />
        <span className="font-semibold tabular-nums text-slate-900">{valesPagos}</span>
        <span className="text-slate-600">de {vales} vales de caixa</span>
      </p>
      <p className={`font-semibold ${quitado ? "text-emerald-700" : "text-red-700"}`}>{quitado ? "Quitado" : "Pendente"}</p>
    </div>
  )
}

function DeliveryItems({ delivery }: { delivery: Delivery }) {
  return (
    <ul className="space-y-1">
      {delivery.mercadorias.map((m, idx) => (
        <li key={idx} className="text-slate-700">
          <span className="font-medium text-slate-900">{m.nomeMercadoria}</span>
          <span className="whitespace-nowrap text-slate-600">
            {" "}&middot; {m.quantidadeCaixa6424} cx 6424
            {m.quantidadePapelao > 0 ? ` · ${m.quantidadePapelao} papelão` : ""}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function AgroVendasPage() {
  // Date and Section State
  const [selectedDate, setSelectedDate] = useState("")
  const [activeSection, setActiveSection] = useState("vendas")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statsOpenMobile, setStatsOpenMobile] = useState(false)
  const [boxStatsOpenMobile, setBoxStatsOpenMobile] = useState(false)

  // Core Data Lists
  const [sales, setSales] = useState<Sale[]>([])
  const [allSales, setAllSales] = useState<Sale[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null)
  const [supplierDeliveries, setSupplierDeliveries] = useState<{ [supplierId: number]: Delivery[] }>({})

  // Modals Open State
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)

  // Editing Reference States
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null)

  // Forms Form State
  const [saleFormData, setSaleFormData] = useState({
    cliente: "",
    modeloCaixa: "Papelão",
    qtdeCaixas6424: 0,
    caixasPagasVale: 0,
    pagamentoVerduras: "Pago",
    valorPago: 0,
  })
  const [saleCustomerQuery, setSaleCustomerQuery] = useState("")
  // The arrow next to the customer field opens the full list of registered customers.
  const [mostrarTodosClientes, setMostrarTodosClientes] = useState(false)
  const [saleCustomerId, setSaleCustomerId] = useState<number | null>(null)
  const [quickCustomerForm, setQuickCustomerForm] = useState({ nome: "", telefone: "", cpfCnpj: "", localizacao: "", observacoes: "" })
  const [saleProducts, setSaleProducts] = useState<ProductItem[]>([])

  // Derived from the items being typed: how many boxes the sale has and whether it has a price yet.
  useEffect(() => {
    if (!saleModalOpen) setMostrarTodosClientes(false)
  }, [saleModalOpen])

  const totalCaixasVenda = saleProducts.reduce((sum, p) => sum + (p.qtde || 0), 0)
  const totalVendaForm = saleProducts.reduce((sum, p) => sum + (p.qtde || 0) * (p.valor || 0), 0)
  const vendaSemPreco = totalVendaForm <= 0

  // With the 6424 model every box sold is a 6424 box, so the count follows the items.
  // With "Misto" it is typed, but can never exceed the boxes in the sale; paid boxes never exceed it either.
  useEffect(() => {
    setSaleFormData((prev) => {
      if (prev.modeloCaixa === "Papelão") return prev
      const qtde = prev.modeloCaixa === "6424" ? totalCaixasVenda : Math.min(prev.qtdeCaixas6424, totalCaixasVenda)
      const pagas = Math.min(prev.caixasPagasVale, qtde)
      if (qtde === prev.qtdeCaixas6424 && pagas === prev.caixasPagasVale) return prev
      return { ...prev, qtdeCaixas6424: qtde, caixasPagasVale: pagas }
    })
  }, [saleFormData.modeloCaixa, totalCaixasVenda])

  const [supplierFormData, setSupplierFormData] = useState({
    nome: "",
    areaCeasa: "",
  })

  const [deliveryProducts, setDeliveryProducts] = useState<DeliveryProduct[]>([])
  const [deliveryDate, setDeliveryDate] = useState("")
  const [merchandises, setMerchandises] = useState<Merchandise[]>([])
  const [merchandiseModalOpen, setMerchandiseModalOpen] = useState(false)
  const [editingMerchandise, setEditingMerchandise] = useState<Merchandise | null>(null)
  const [merchandiseName, setMerchandiseName] = useState("")
  const [deliveryValorTotal, setDeliveryValorTotal] = useState("")
  const [deliveryValorPago, setDeliveryValorPago] = useState("")
  const [deliveryValesPagos, setDeliveryValesPagos] = useState("")

  // Quick action states
  const [returnBoxModalOpen, setReturnBoxModalOpen] = useState(false)
  const [boxReturnAmount, setBoxReturnAmount] = useState(0)
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null)

  // Set today's date on initial client render
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setSelectedDate(today)
    setDeliveryDate(today)
  }, [])

  // ================= FETCHING OPERATIONS =================

  // Load Sales for Selected Date
  const loadSales = useCallback(async (date: string) => {
    if (!date) return
    try {
      const res = await apiCall(`/vendas?data=${date}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data)
      } else {
        console.error("Erro ao buscar vendas")
      }
    } catch (e) {
      console.error("Erro de conexão ao buscar vendas:", e)
    }
  }, [])

  // Load All Sales (all dates for crate tracking)
  const loadAllSales = useCallback(async () => {
    try {
      const res = await apiCall(`/vendas`)
      if (res.ok) {
        const data = await res.json()
        setAllSales(data)
      } else {
        console.error("Erro ao buscar todas as vendas")
      }
    } catch (e) {
      console.error("Erro de conexão ao buscar vendas:", e)
    }
  }, [])

  // Load All Suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      const res = await apiCall(`/fornecedores`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      }
    } catch (e) {
      console.error("Erro de conexão ao buscar fornecedores:", e)
    }
  }, [])

  const loadMerchandises = useCallback(async () => {
    try {
      const res = await apiCall(`/mercadorias`)
      if (res.ok) setMerchandises(await res.json())
    } catch (e) {
      console.error("Erro de conexão ao buscar mercadorias:", e)
    }
  }, [])

  const loadCustomers = useCallback(async (search = "") => {
    try {
      const res = await apiCall(`/clientes${search ? `?busca=${encodeURIComponent(search)}` : ""}`)
      if (res.ok) setCustomers(await res.json())
    } catch (e) { console.error("Erro ao buscar clientes:", e) }
  }, [])

  const loadCustomerDetails = async (id: number) => {
    const res = await apiCall(`/clientes/${id}`)
    if (res.ok) setCustomerDetails(await res.json())
  }

  // Load Deliveries for specific supplier
  const loadSupplierDeliveries = useCallback(async (supplierId: number) => {
    try {
      const res = await apiCall(`/fornecedores/${supplierId}/entregas`)
      if (res.ok) {
        const data = await res.json()
        setSupplierDeliveries((prev) => ({
          ...prev,
          [supplierId]: data,
        }))
      }
    } catch (e) {
      console.error(`Erro ao buscar entregas do fornecedor ${supplierId}:`, e)
    }
  }, [])

  // Load initial dashboard elements
  useEffect(() => {
    if (selectedDate) {
      loadSales(selectedDate)
    }
    loadSuppliers()
    loadCustomers()
    loadMerchandises()
    loadAllSales()
  }, [selectedDate, loadSales, loadSuppliers, loadCustomers, loadMerchandises, loadAllSales])

  // Load deliveries for expanded suppliers
  useEffect(() => {
    if (expandedSupplier !== null) {
      loadSupplierDeliveries(expandedSupplier)
    }
  }, [expandedSupplier, loadSupplierDeliveries])

  // Refresh current active view
  const refreshAll = () => {
    if (selectedDate) {
      loadSales(selectedDate)
    }
    loadSuppliers()
    if (expandedSupplier !== null) {
      loadSupplierDeliveries(expandedSupplier)
    }
  };

  // ================= SALES WORKBOOK OPERATIONS =================

  const openNewSaleModal = () => {
    setEditingSale(null)
    setSaleFormData({
      cliente: "",
      modeloCaixa: "Papelão",
      qtdeCaixas6424: 0,
      caixasPagasVale: 0,
      pagamentoVerduras: "Pago",
      valorPago: 0,
    })
    setSaleCustomerId(null)
    setSaleCustomerQuery("")
    setSaleProducts([{ nome: "", qtde: 1, valor: 0.0 }])
    setSaleModalOpen(true)
  }

  const openEditSaleModal = (sale: Sale) => {
    setEditingSale(sale)
    setSaleFormData({
      cliente: sale.cliente,
      modeloCaixa: sale.modeloCaixa,
      qtdeCaixas6424: sale.qtdeCaixas6424,
      caixasPagasVale: sale.caixasPagasVale,
      pagamentoVerduras: sale.pagamentoVerduras,
      valorPago: sale.valorPago,
    })
    setSaleCustomerId(sale.clienteId ?? null)
    setSaleCustomerQuery(sale.cliente)
    setSaleProducts(sale.mercadorias.map(m => ({ nome: m.nome, qtde: m.qtde, valor: m.valor })))
    setSaleModalOpen(true)
  }

  const addSaleProductItem = () => {
    setSaleProducts([...saleProducts, { nome: "", qtde: 1, valor: 0 }])
  }

  const removeSaleProductItem = (idx: number) => {
    setSaleProducts(saleProducts.filter((_, i) => i !== idx))
  }

  const updateSaleProductItem = (idx: number, field: keyof ProductItem, value: string | number) => {
    const updated = [...saleProducts]
    updated[idx] = { ...updated[idx], [field]: value }
    setSaleProducts(updated)
  }

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saleProducts.some((p) => !p.nome.trim() || p.qtde <= 0)) {
      alert("Certifique-se de que todas as mercadorias tenham nome e quantidade maiores que zero.")
      return
    }

    // The server recomputes these; they are sent so the request is complete and the form stays consistent.
    const qtde6424 = saleFormData.modeloCaixa === "6424" ? totalCaixasVenda : saleFormData.qtdeCaixas6424
    let calculatedOwed = 0
    if (saleFormData.modeloCaixa === "6424" || saleFormData.modeloCaixa === "Misto") {
      calculatedOwed = Math.max(0, qtde6424 - saleFormData.caixasPagasVale)
    }
    // Without a price there is nothing to pay yet: the sale is recorded as "Devendo".
    const pagamento = vendaSemPreco ? "Devendo" : saleFormData.pagamentoVerduras

    const payload: Sale = {
      id: editingSale?.id || undefined,
      data: selectedDate,
      cliente: saleFormData.cliente,
      clienteId: saleCustomerId,
      modeloCaixa: saleFormData.modeloCaixa,
      qtdeCaixas6424: saleFormData.modeloCaixa !== "Papelão" ? qtde6424 : 0,
      caixasPagasVale: saleFormData.modeloCaixa !== "Papelão" ? saleFormData.caixasPagasVale : 0,
      caixasDevendoVale: calculatedOwed,
      pagamentoVerduras: pagamento,
      valorPago: pagamento === "Parcial" ? saleFormData.valorPago : 0,
      mercadorias: saleProducts,
    }

    try {
      const res = await apiCall(`/vendas`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSaleModalOpen(false)
        loadSales(selectedDate)
      } else {
        alert(await mensagemDoServidor(res, "Erro ao salvar a venda."))
      }
    } catch (err) {
      console.error(err)
      alert("Erro de conexão ao salvar a venda.")
    }
  }

  const alternarListaClientes = () => {
    if (mostrarTodosClientes) {
      setMostrarTodosClientes(false)
      return
    }
    loadCustomers("")
    setMostrarTodosClientes(true)
  }

  const selectSaleCustomer = (customer: Customer) => {
    setMostrarTodosClientes(false)
    setSaleCustomerId(customer.id)
    setSaleCustomerQuery(customer.nome)
    setSaleFormData(prev => ({ ...prev, cliente: customer.nome }))
  }

  const setUnknownCustomer = () => {
    setSaleCustomerId(null)
    setSaleCustomerQuery("Cliente desconhecido")
    setSaleFormData(prev => ({ ...prev, cliente: "Cliente desconhecido" }))
  }

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickCustomerForm.nome.trim()) return
    const res = await apiCall(`/clientes`, { method: "POST", body: JSON.stringify(quickCustomerForm) })
    if (!res.ok) { alert("Não foi possível cadastrar o cliente."); return }
    const customer: Customer = await res.json()
    selectSaleCustomer(customer)
    setCustomerModalOpen(false)
    setQuickCustomerForm({ nome: "", telefone: "", cpfCnpj: "", localizacao: "", observacoes: "" })
    loadCustomers()
  }

  const saveCustomer = async (customer: Customer, e: React.FormEvent) => {
    e.preventDefault()
    const method = customer.id ? "PUT" : "POST"
    const url = customer.id ? `/clientes/${customer.id}` : `/clientes`
    const res = await apiCall(url, { method, body: JSON.stringify(customer) })
    if (res.ok) { setSelectedCustomer(null); loadCustomers(customerSearch) } else alert("Erro ao salvar cliente.")
  }

  const deleteCustomer = async (id: number) => {
    if (!confirm("Excluir este cliente? As vendas permanecerão registradas, mas sem vínculo ao cadastro.")) return
    const res = await apiCall(`/clientes/${id}`, { method: "DELETE" })
    if (res.ok) { setCustomerDetails(null); loadCustomers(customerSearch) }
  }

  const generateHistoryHTML = () => {
    if (!customerDetails) return ""
    return gerarHistoricoClienteHtml(customerDetails)
  }

  const printCustomerHistory = () => {
    if (!customerDetails) return
    const printWindow = window.open("", "", "width=900,height=700")
    if (printWindow) {
      printWindow.document.write(generateHistoryHTML())
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  const downloadCustomerHistoryPDF = async () => {
    if (!customerDetails) return
    const html2pdf = (await import("html2pdf.js")).default
    const element = document.createElement("div")
    element.innerHTML = generateHistoryHTML()

    const opt: any = {
      margin: 10,
      filename: `historico_${customerDetails.cliente.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    }

    html2pdf().set(opt).from(element).save()
  }

  const exportSalesToExcel = () => {
    if (sales.length === 0) {
      alert("Nenhuma venda para exportar.")
      return
    }

    const data = sales.map(sale => ({
      Data: new Date(sale.data + "T00:00:00").toLocaleDateString("pt-BR"),
      Cliente: sale.cliente,
      Mercadorias: sale.mercadorias.map(m => `${m.nome} (${m.qtde})`).join("; "),
      "Modelo Caixa": sale.modeloCaixa,
      "Qtde Caixas 6424": sale.qtdeCaixas6424 || "-",
      "Caixas Pagas": sale.caixasPagasVale || "-",
      "Caixas Devendo": sale.caixasDevendoVale || "-",
      "Status Pagamento": sale.pagamentoVerduras,
      "Valor Pago": sale.valorPago || "-",
      Total: sale.mercadorias.reduce((total, m) => total + m.qtde * m.valor, 0).toFixed(2),
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas")

    // Ajustar largura das colunas
    const colWidths = [12, 20, 35, 15, 15, 12, 12, 18, 12, 12]
    worksheet["!cols"] = colWidths.map(width => ({ wch: width }))

    XLSX.writeFile(workbook, `vendas_${selectedDate || new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const handleDeleteSale = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta venda?")) return
    try {
      const res = await apiCall(`/vendas/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        loadSales(selectedDate)
      } else {
        alert("Erro ao excluir venda.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ================= SUPPLIERS LOGISTICS OPERATIONS =================

  const openNewSupplierModal = () => {
    setEditingSupplier(null)
    setSupplierFormData({ nome: "", areaCeasa: "" })
    setSupplierModalOpen(true)
  }

  const openEditSupplierModal = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSupplier(supplier)
    setSupplierFormData({ nome: supplier.nome, areaCeasa: supplier.areaCeasa })
    setSupplierModalOpen(true)
  }

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierFormData.nome.trim()) {
      alert("Por favor, preencha o nome do produtor rural.")
      return
    }

    const method = editingSupplier ? "PUT" : "POST"
    const url = editingSupplier ? `/fornecedores/${editingSupplier.id}` : `/fornecedores`

    try {
      const res = await apiCall(url, {
        method,
        body: JSON.stringify(supplierFormData),
      })

      if (res.ok) {
        setSupplierModalOpen(false)
        loadSuppliers()
      } else {
        alert("Erro ao salvar o fornecedor.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSupplier = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Tem certeza que deseja excluir este fornecedor? Todas as entregas associadas serão removidas.")) return
    try {
      const res = await apiCall(`/fornecedores/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        loadSuppliers()
        if (expandedSupplier === id) setExpandedSupplier(null)
      } else {
        alert("Erro ao excluir fornecedor.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ================= MERCHANDISE CRUD =================

  const openNewMerchandiseModal = () => {
    setEditingMerchandise(null)
    setMerchandiseName("")
    setMerchandiseModalOpen(true)
  }

  const openEditMerchandiseModal = (m: Merchandise) => {
    setEditingMerchandise(m)
    setMerchandiseName(m.nome)
    setMerchandiseModalOpen(true)
  }

  const handleMerchandiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchandiseName.trim()) return
    const url = editingMerchandise ? `/mercadorias/${editingMerchandise.id}` : `/mercadorias`
    try {
      const res = await apiCall(url, {
        method: editingMerchandise ? "PUT" : "POST",
        body: JSON.stringify({ nome: merchandiseName.trim() }),
      })
      if (res.ok) {
        setMerchandiseModalOpen(false)
        loadMerchandises()
      } else {
        const body = await res.json().catch(() => null)
        alert(body?.erro || "Erro ao salvar mercadoria.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMerchandise = async (m: Merchandise) => {
    if (!confirm(`Excluir a mercadoria "${m.nome}"?`)) return
    try {
      const res = await apiCall(`/mercadorias/${m.id}`, { method: "DELETE" })
      if (res.ok) {
        loadMerchandises()
      } else {
        const body = await res.json().catch(() => null)
        alert(body?.erro || "Erro ao excluir mercadoria.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ================= SUPPLIER DELIVERIES OPERATIONS =================

  const openNewDeliveryModal = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setEditingDelivery(null)
    setDeliveryDate(selectedDate || new Date().toISOString().split("T")[0])
    setDeliveryProducts([{ nomeMercadoria: "", quantidadeCaixa6424: 0, quantidadePapelao: 0 }])
    setDeliveryValorTotal("")
    setDeliveryValorPago("")
    setDeliveryValesPagos("")
    deliveryModalOpenStateChange(true)
  }

  const openEditDeliveryModal = (supplier: Supplier, delivery: Delivery, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setEditingDelivery(delivery)
    setDeliveryDate(delivery.data)
    setDeliveryValorTotal(delivery.valorTotal ? String(delivery.valorTotal) : "")
    setDeliveryValorPago(delivery.valorPago ? String(delivery.valorPago) : "")
    setDeliveryValesPagos(delivery.valesPagos ? String(delivery.valesPagos) : "")
    setDeliveryProducts(delivery.mercadorias.map(m => ({
      nomeMercadoria: m.nomeMercadoria,
      quantidadeCaixa6424: m.quantidadeCaixa6424,
      quantidadePapelao: m.quantidadePapelao
    })))
    deliveryModalOpenStateChange(true)
  }

  const deliveryModalOpenStateChange = (open: boolean) => {
    setDeliveryModalOpen(open)
    if (!open) {
      // If we close the delivery modal, make sure to reload deliveries
      if (selectedSupplier) {
        loadSupplierDeliveries(selectedSupplier.id)
      }
    }
  }

  const addDeliveryProductItem = () => {
    setDeliveryProducts([...deliveryProducts, { nomeMercadoria: "", quantidadeCaixa6424: 0, quantidadePapelao: 0 }])
  }

  const removeDeliveryProductItem = (idx: number) => {
    setDeliveryProducts(deliveryProducts.filter((_, i) => i !== idx))
  }

  const updateDeliveryProductItem = (idx: number, field: keyof DeliveryProduct, value: string | number) => {
    const updated = [...deliveryProducts]
    updated[idx] = { ...updated[idx], [field]: value } as any
    setDeliveryProducts(updated)
  }

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier) return
    if (!deliveryDate) {
      alert("Por favor, selecione a data da entrega.")
      return
    }
    if (deliveryProducts.some(p => !p.nomeMercadoria.trim() || (p.quantidadeCaixa6424 <= 0 && p.quantidadePapelao <= 0))) {
      alert("Toda mercadoria deve conter nome e pelo menos 1 caixa plástica ou de papelão.")
      return
    }

    const payload: Delivery = {
      id: editingDelivery?.id || undefined,
      data: deliveryDate,
      valorTotal: parseFloat(deliveryValorTotal) || 0,
      valorPago: parseFloat(deliveryValorPago) || 0,
      valesPagos: parseInt(deliveryValesPagos) || 0,
      mercadorias: deliveryProducts,
    }

    try {
      const res = await apiCall(`/fornecedores/${selectedSupplier.id}/entregas`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setDeliveryModalOpen(false)
        loadSupplierDeliveries(selectedSupplier.id)
        refreshAll()
      } else {
        alert(await mensagemDoServidor(res, "Erro ao salvar entrega."))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleQuitarDelivery = async (supplier: Supplier, delivery: Delivery, e: React.MouseEvent) => {
    e.stopPropagation()
    const payload: Delivery = {
      ...delivery,
      valorPago: delivery.valorTotal || 0,
      valesPagos: delivery.mercadorias.reduce((s, m) => s + m.quantidadeCaixa6424, 0),
    }
    try {
      const res = await apiCall(`/fornecedores/${supplier.id}/entregas`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (res.ok) loadSupplierDeliveries(supplier.id)
      else alert(await mensagemDoServidor(res, "Erro ao registrar pagamento."))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDelivery = async (deliveryId: number, supplierId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Excluir esta entrega?")) return
    try {
      const res = await apiCall(`/entregas/${deliveryId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        loadSupplierDeliveries(supplierId)
        refreshAll()
      } else {
        alert("Erro ao excluir entrega.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Quick Action: Return Owed Boxes
  const openReturnBoxModal = (sale: Sale) => {
    setSelectedSaleForReturn(sale)
    setBoxReturnAmount(sale.caixasDevendoVale)
    setReturnBoxModalOpen(true)
  }

  const handleReturnBoxSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSaleForReturn) return
    if (boxReturnAmount <= 0 || boxReturnAmount > selectedSaleForReturn.caixasDevendoVale) {
      alert("Quantidade inválida para retorno.")
      return
    }

    const updatedSale: Sale = {
      ...selectedSaleForReturn,
      caixasPagasVale: selectedSaleForReturn.caixasPagasVale + boxReturnAmount,
      caixasDevendoVale: selectedSaleForReturn.caixasDevendoVale - boxReturnAmount,
    }

    try {
      const res = await apiCall(`/vendas`, {
        method: "POST",
        body: JSON.stringify(updatedSale),
      })

      if (res.ok) {
        setReturnBoxModalOpen(false)
        loadSales(selectedDate)
        loadAllSales()
      } else {
        alert(await mensagemDoServidor(res, "Erro ao registrar devolução."))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ================= AGGREGATIONS & CALCULATIONS =================

  // Sales Summary
  const totalSalesCount = sales.length
  const totalSalesPaid = sales.filter((s) => s.pagamentoVerduras === "Pago").length
  const totalSalesOwing = sales.filter((s) => s.pagamentoVerduras === "Devendo" || s.pagamentoVerduras === "Parcial").length
  const totalBoxesSold = sales.reduce((acc, sale) => acc + sale.mercadorias.reduce((sum, p) => sum + p.qtde, 0), 0)

  // Crate summary balances
  const totalBoxesOwedByClients = sales.reduce((acc, sale) => acc + sale.caixasDevendoVale, 0)
  const totalBoxesPagasByClients = sales.reduce((acc, sale) => acc + sale.caixasPagasVale, 0)

  // Compute daily consolidates by parsing deliveries on the selected date
  const computeDailyStock = () => {
    const dailyDeliveries: {
      [productName: string]: {
        total: number
        papelao: number
        caixa6424: number
        suppliers: Set<string>
      }
    } = {}

    // Gather all deliveries for the selected date across all suppliers loaded in memory
    Object.entries(supplierDeliveries).forEach(([supId, deliveriesList]) => {
      const supplierName = suppliers.find(s => s.id === Number(supId))?.nome || "Desconhecido"
      deliveriesList.forEach(del => {
        if (del.data === selectedDate) {
          del.mercadorias.forEach(item => {
            const name = item.nomeMercadoria.toUpperCase().trim()
            if (!dailyDeliveries[name]) {
              dailyDeliveries[name] = { total: 0, papelao: 0, caixa6424: 0, suppliers: new Set() }
            }
            dailyDeliveries[name].total += (item.quantidadeCaixa6424 + item.quantidadePapelao)
            dailyDeliveries[name].papelao += item.quantidadePapelao
            dailyDeliveries[name].caixa6424 += item.quantidadeCaixa6424
            dailyDeliveries[name].suppliers.add(supplierName)
          })
        }
      })
    })

    // Gather all sales for the selected date
    const dailySales: { [productName: string]: number } = {}
    sales.forEach(sale => {
      sale.mercadorias.forEach(item => {
        const name = item.nome.toUpperCase().trim()
        if (!dailySales[name]) {
          dailySales[name] = 0
        }
        dailySales[name] += item.qtde
      })
    })

    return { dailyDeliveries, dailySales }
  }

  const { dailyDeliveries, dailySales } = computeDailyStock()

  // Calculate box counts delivered by suppliers
  const computeSupplierBoxes = () => {
    const counts: { [supplierName: string]: { total6424: number; totalPapelao: number } } = {}
    
    suppliers.forEach(s => {
      counts[s.nome] = { total6424: 0, totalPapelao: 0 }
      const deliveriesList = supplierDeliveries[s.id] || []
      deliveriesList.forEach(del => {
        del.mercadorias.forEach(item => {
          counts[s.nome].total6424 += item.quantidadeCaixa6424
          counts[s.nome].totalPapelao += item.quantidadePapelao
        })
      })
    })
    
    return counts
  }
  const supplierBoxTotals = computeSupplierBoxes()

  // Calculate overall delivered 6424 boxes
  const totalDeliveredSupplierBoxes6424 = Object.values(supplierBoxTotals).reduce((sum, item) => sum + item.total6424, 0)

  // Expand supplier on click and load deliveries if not loaded
  const toggleSupplier = (supplierId: number) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null)
    } else {
      setExpandedSupplier(supplierId)
    }
  }

  // helper to get nice payment badge styles
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Pago":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "Parcial":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Devendo":
      default:
        return "bg-rose-100 text-rose-800 border-rose-200"
    }
  }

  const { user } = useAuth()

  const navItems: { key: string; label: string; icon: typeof BarChart3; onClick: () => void }[] = [
    { key: "vendas", label: "Planilha de Vendas", icon: BarChart3, onClick: () => setActiveSection("vendas") },
    { key: "fornecedores", label: "Gestão de Entregas", icon: Truck, onClick: () => setActiveSection("fornecedores") },
    { key: "mercadorias", label: "Mercadorias", icon: Apple, onClick: () => { setActiveSection("mercadorias"); loadMerchandises() } },
    { key: "clientes", label: "Clientes", icon: Users, onClick: () => { setActiveSection("clientes"); loadCustomers() } },
    { key: "estoque", label: "Estoque & Comparativo", icon: Layers, onClick: () => setActiveSection("estoque") },
    { key: "caixas", label: "Controle de Caixas 6424", icon: Package, onClick: () => setActiveSection("caixas") },
    // Account management exists only for administrators (the server enforces it as well).
    ...(user?.role === "ADMIN"
      ? [{ key: "usuarios", label: "Usuários e acessos", icon: ShieldCheck, onClick: () => setActiveSection("usuarios") }]
      : []),
  ]

  const sectionTitle: Record<string, string> = {
    vendas: "Planilha de Vendas Diárias",
    fornecedores: "Gestão de Entregas & Produtores",
    mercadorias: "Cadastro de Mercadorias",
    clientes: "Cadastro de Clientes",
    estoque: "Estoque Consolidado do Dia",
    caixas: "Gestão de Caixas 6424",
    usuarios: "Usuários e acessos",
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        {/* Navigation rail */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-emerald-900 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-72 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Navegação principal"
        >
          <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white p-1">
                <img src="/logo-mark.png" alt="" className="h-full w-full object-contain" />
              </div>
              <div className="leading-tight">
                <p className="text-lg font-semibold tracking-tight">AgroVendas</p>
                <p className="text-sm text-emerald-200">CEASA Hortifruti</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-md text-emerald-100 hover:bg-white/10 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Seções">
            <ul className="space-y-1">
              {navItems.map(({ key, label, icon: Icon, onClick }) => (
                <li key={key}>
                  <button
                    onClick={() => { onClick(); setSidebarOpen(false) }}
                    aria-current={activeSection === key ? "page" : undefined}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-base transition-colors duration-150 ${
                      activeSection === key
                        ? "bg-white/12 font-semibold text-white"
                        : "text-emerald-100 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="leading-snug">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/12 px-5 py-4">
            <p className="truncate text-base font-medium">{user?.nome}</p>
            <p className="truncate text-sm text-emerald-200">{user?.email}</p>
            <div className="mt-2 -ml-3 flex flex-col items-start">
              <ChangePasswordDialog />
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main Container Content */}
        <main className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-11 items-center gap-2 rounded-md px-3 text-base font-semibold text-slate-800 hover:bg-slate-100"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
              Menu
            </button>
            <div className="flex items-center gap-2 pr-1">
              <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-slate-900">AgroVendas</span>
            </div>
          </div>

          <div className="mx-auto max-w-7xl space-y-6 px-4 pb-32 pt-5 sm:px-6 md:pb-12 lg:space-y-8 lg:px-10 lg:pt-10">

          {/* Page header with the working date */}
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {sectionTitle[activeSection]}
            </h1>

            <div className="flex items-center gap-3">
              <Label htmlFor="global-date" className="shrink-0 text-base text-slate-600">Data</Label>
              <input
                id="global-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  // Preload all supplier deliveries if expanded is active
                  if (expandedSupplier !== null) {
                    loadSupplierDeliveries(expandedSupplier)
                  }
                }}
                className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-base font-medium text-slate-900 hover:border-slate-400 focus-visible:border-emerald-600 sm:flex-none"
              />
            </div>
          </header>

          {/* ================= SECTION 1: VENDAS DO DIA ================= */}
          {activeSection === "vendas" && (
            <div className="space-y-6">

              {/* Day summary: one ruled strip, not four cards */}
              <dl className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white md:grid-cols-4">
                <div className="col-span-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:col-span-1 md:border-b-0 md:border-r">
                  <dt className="text-sm text-slate-600">Total vendido</dt>
                  <dd className="mt-1 whitespace-nowrap text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
                    {brl(sales.reduce((sum, sale) => sum + saleTotal(sale), 0))}
                  </dd>
                </div>
                <div className="border-r border-slate-200 px-4 py-4 sm:px-5">
                  <dt className="text-sm text-slate-600">Pagas</dt>
                  <dd className="mt-1 whitespace-nowrap text-3xl font-semibold tracking-tight tabular-nums text-emerald-700">
                    {totalSalesPaid}<span className="text-base font-medium text-slate-600"> de {totalSalesCount}</span>
                  </dd>
                </div>
                <div className="border-r border-slate-200 px-4 py-4 sm:px-5">
                  <dt className="text-sm text-slate-600">Em aberto</dt>
                  <dd className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${totalSalesOwing > 0 ? "text-red-700" : "text-slate-900"}`}>{totalSalesOwing}</dd>
                </div>
                <div className="px-4 py-4 sm:px-5">
                  <dt className="text-sm text-slate-600">Caixas</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{totalBoxesSold}</dd>
                </div>
              </dl>

              {/* Sales ledger */}
              <section aria-labelledby="sales-heading">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 id="sales-heading" className="text-xl font-semibold text-slate-900">Planilha do dia</h2>
                    <p className="text-sm text-slate-600">
                      {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR") : ""}
                      {" "}&middot; {sales.length} {sales.length === 1 ? "venda" : "vendas"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportSalesToExcel} variant="outline" className="flex-1 sm:flex-none">
                      <FileDown aria-hidden /> Exportar Excel
                    </Button>
                    <Button onClick={openNewSaleModal} className="hidden md:inline-flex">
                      <Plus aria-hidden /> Nova venda
                    </Button>
                  </div>
                </div>

                {/* Mobile: ruled rows */}
                <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white md:hidden">
                  {sales.map((sale) => (
                    <article key={sale.id} className="space-y-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold leading-snug text-slate-900">{sale.cliente}</h3>
                          <p className="mt-0.5 text-base"><PaymentStatus sale={sale} /></p>
                        </div>
                        <p className="shrink-0 tabular-nums text-xl font-semibold text-slate-900">{precoPendente(sale) ? "Preço a definir" : brl(saleTotal(sale))}</p>
                      </div>

                      <ul className="space-y-1 text-base text-slate-700">
                        {sale.mercadorias.map((m, idx) => (
                          <li key={idx} className="flex justify-between gap-3">
                            <span><span className="font-medium text-slate-900">{m.nome}</span> &middot; {m.qtde} cx</span>
                            <span className="tabular-nums text-slate-600">{m.valor > 0 ? brl(m.qtde * m.valor) : "sem preço"}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="border-t border-dashed border-slate-200 pt-3 text-base">
                        <BoxVale sale={sale} showModel />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {sale.caixasDevendoVale > 0 && (
                          <Button variant="outline" onClick={() => openReturnBoxModal(sale)} className="col-span-2">
                            Devolver vales
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => openEditSaleModal(sale)}>
                          <Edit aria-hidden /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeleteSale(sale.id!)}
                          className="text-red-700 hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 aria-hidden /> Excluir
                        </Button>
                      </div>
                    </article>
                  ))}

                  {sales.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <p className="text-lg font-semibold text-slate-900">Nenhuma venda neste dia</p>
                      <p className="mx-auto mt-1 max-w-xs text-base text-slate-600">
                        Toque em &ldquo;Nova venda&rdquo; para lançar a primeira.
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop: dense table */}
                <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b border-slate-300 text-left text-sm font-semibold text-slate-600">
                        <th scope="col" className="px-4 py-3">Cliente</th>
                        <th scope="col" className="px-4 py-3">Mercadorias</th>
                        <th scope="col" className="whitespace-nowrap px-4 py-3">Caixas 6424 (vale)</th>
                        <th scope="col" className="px-4 py-3 text-right">Total</th>
                        <th scope="col" className="px-4 py-3">Pagamento</th>
                        <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="align-top transition-colors hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{sale.cliente}</p>
                            <p className="text-sm text-slate-600">Caixa {sale.modeloCaixa}</p>
                          </td>
                          <td className="px-4 py-4">
                            <ul className="space-y-1">
                              {sale.mercadorias.map((m, idx) => (
                                <li key={idx} className="text-slate-700">
                                  <span className="font-medium text-slate-900">{m.nome}</span>
                                  <span className="whitespace-nowrap text-slate-600"> &middot; {m.qtde} cx{m.valor > 0 ? <> &times; {brl(m.valor)}</> : " · sem preço"}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-4 py-4 text-sm"><BoxVale sale={sale} onReturn={() => openReturnBoxModal(sale)} /></td>
                          <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-lg font-semibold text-slate-900">
                            {precoPendente(sale) ? "A definir" : brl(saleTotal(sale))}
                          </td>
                          <td className="px-4 py-4"><PaymentStatus sale={sale} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditSaleModal(sale)}
                                aria-label={`Editar venda de ${sale.cliente}`}
                                title="Editar"
                              >
                                <Edit aria-hidden />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteSale(sale.id!)}
                                aria-label={`Excluir venda de ${sale.cliente}`}
                                title="Excluir"
                                className="text-red-700 hover:bg-red-50"
                              >
                                <Trash2 aria-hidden />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {sales.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-14 text-center">
                            <p className="text-lg font-semibold text-slate-900">Nenhuma venda neste dia</p>
                            <p className="mx-auto mt-1 max-w-sm text-base text-slate-600">
                              Use &ldquo;Nova venda&rdquo; para lançar a primeira.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Primary action for phones: always within thumb reach */}
          {activeSection === "vendas" && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
              <Button onClick={openNewSaleModal} size="lg" className="w-full text-lg">
                <Plus aria-hidden /> Nova venda
              </Button>
            </div>
          )}

          {activeSection === "usuarios" && user?.role === "ADMIN" && <UsersPanel />}

          {activeSection === "clientes" && (
            <div className="space-y-6">
              <Card className="border-slate-100">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div><CardTitle>Clientes cadastrados</CardTitle><p className="text-sm text-slate-500 mt-1">Pesquise, mantenha os dados e consulte o histórico de compras.</p></div>
                  <Button onClick={() => setSelectedCustomer({ id: 0, nome: "", telefone: "", cpfCnpj: "", localizacao: "", observacoes: "" })}><Plus className="w-4 h-4 mr-2" />Novo cliente</Button>
                </CardHeader>
                <CardContent>
                  <Input value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); loadCustomers(e.target.value) }} placeholder="Buscar por nome..." className="mb-4" />
                  <div className="divide-y divide-slate-100">
                    {customers.map(customer => <div key={customer.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div><p className="font-bold text-slate-900">{customer.nome}</p><p className="text-sm text-slate-500">{customer.telefone || customer.localizacao || "Sem contato informado"}</p></div>
                      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => loadCustomerDetails(customer.id)}>Histórico</Button><Button variant="outline" size="icon" onClick={() => setSelectedCustomer(customer)}><Edit className="w-4 h-4" /></Button><Button variant="destructive" size="icon" onClick={() => deleteCustomer(customer.id)}><Trash2 className="w-4 h-4" /></Button></div>
                    </div>)}
                    {customers.length === 0 && <p className="py-10 text-center text-slate-400">Nenhum cliente encontrado.</p>}
                  </div>
                </CardContent>
              </Card>
              {customerDetails && (
                <Card className="border-emerald-100">
                  <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Histórico de {customerDetails.cliente.nome}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{customerDetails.cliente.telefone || ""} {customerDetails.cliente.localizacao ? `• ${customerDetails.cliente.localizacao}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={printCustomerHistory}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadCustomerHistoryPDF}
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Download className="w-4 h-4 mr-2" /> Salvar PDF
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setCustomerDetails(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customerDetails.vendas.map(sale => (
                      <div key={sale.id} className="p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between font-semibold">
                          <span>{new Date(sale.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPaymentBadge(sale.pagamentoVerduras)}`}>
                            {sale.pagamentoVerduras}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{sale.mercadorias.map(m => `${m.nome} (${m.qtde})`).join(", ")}</p>
                        <p className="text-sm font-bold mt-1">Total: R$ {sale.mercadorias.reduce((total, m) => total + m.qtde * m.valor, 0).toFixed(2)}</p>
                      </div>
                    ))}
                    {customerDetails.vendas.length === 0 && <p className="text-slate-400">Este cliente ainda não possui compras vinculadas.</p>}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ================= SECTION: MERCADORIAS ================= */}
          {activeSection === "mercadorias" && (
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Mercadorias</CardTitle>
                <Button onClick={openNewMerchandiseModal}>
                  <Plus className="w-4 h-4 mr-2" />Nova mercadoria
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {merchandises.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="font-bold text-slate-900">{m.nome}</p>
                      <div className="flex items-center gap-1.5">
                        <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => openEditMerchandiseModal(m)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-10 w-10" onClick={() => handleDeleteMerchandise(m)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {merchandises.length === 0 && (
                    <p className="text-center py-10 text-slate-400">Nenhuma mercadoria cadastrada.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================= SECTION 2: GESTÃO DE ENTREGAS & FORNECEDORES ================= */}
          {activeSection === "fornecedores" && (
            <div className="space-y-8">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Produtores Cadastrados</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Gerencie os fornecedores rurais e registre suas entregas de mercadorias no CEASA.</p>
                </div>

                <Button
                  onClick={openNewSupplierModal}
                  className="self-start sm:self-auto"
                >
                  <Plus aria-hidden /> Cadastrar produtor
                </Button>
              </div>

              {/* Grid lists of suppliers */}
              <div className="grid grid-cols-1 gap-6">
                {suppliers.map((supplier) => {
                  const isExpanded = expandedSupplier === supplier.id
                  const deliveries = supplierDeliveries[supplier.id] || []
                  const totals = supplierBoxTotals[supplier.nome] || { total6424: 0, totalPapelao: 0 }

                  return (
                    <Card key={supplier.id} className="shadow-md border border-slate-100 overflow-hidden transition-all duration-200">
                      
                      {/* Supplier Card Header */}
                      <div
                        onClick={() => toggleSupplier(supplier.id)}
                        className="p-4 sm:p-6 bg-white hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors border-b border-slate-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 shrink-0">
                            <UserCircle className="w-6 h-6 text-emerald-700" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-lg font-bold text-slate-900 truncate">{supplier.nome}</h4>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              Local CEASA: <span className="text-slate-700 font-bold">{supplier.areaCeasa}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-stretch md:self-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 h-9 rounded-xl font-bold flex-1 md:flex-none"
                            onClick={(e) => openNewDeliveryModal(supplier, e)}
                          >
                            Lançar entrega
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-slate-200 h-10 w-10 shrink-0"
                            onClick={(e) => openEditSupplierModal(supplier, e)}
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-10 w-10 shrink-0"
                            onClick={(e) => handleDeleteSupplier(supplier.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-slate-400 hover:text-slate-600 shrink-0"
                            onClick={() => toggleSupplier(supplier.id)}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Lieferungen history */}
                      {isExpanded && (
                        <div className="bg-slate-50/50 p-4 sm:p-6 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <h5 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                              <Truck className="w-4 h-4 text-emerald-600" /> Histórico de Entregas
                            </h5>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium text-slate-700">
                              <div>
                                Caixas 6424 Entregues: <span className="text-emerald-700 font-semibold">{totals.total6424}</span>
                              </div>
                              <div>
                                Caixas Papelão Entregues: <span className="text-amber-800 font-semibold">{totals.totalPapelao}</span>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white md:hidden">
                            {deliveries.map((delivery) => (
                              <article key={delivery.id} className="space-y-3 px-4 py-4">
                                <h6 className="text-lg font-semibold text-slate-900">
                                  {new Date(delivery.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                </h6>
                                <DeliveryItems delivery={delivery} />
                                <p className="text-sm text-slate-600">
                                  Total: {deliveryVales(delivery)} cx 6424 &middot; {delivery.mercadorias.reduce((s, m) => s + m.quantidadePapelao, 0)} papelão
                                </p>
                                <div className="border-t border-dashed border-slate-200 pt-3 text-base">
                                  <DeliveryPayment delivery={delivery} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button variant="outline" className="col-span-2" onClick={(e) => handleQuitarDelivery(supplier, delivery, e)}>
                                    Quitar entrega
                                  </Button>
                                  <Button variant="outline" onClick={(e) => openEditDeliveryModal(supplier, delivery, e)}>
                                    <Edit aria-hidden /> Editar
                                  </Button>
                                  <Button variant="destructive" onClick={(e) => handleDeleteDelivery(delivery.id!, supplier.id, e)}>
                                    <Trash2 aria-hidden /> Excluir
                                  </Button>
                                </div>
                              </article>
                            ))}
                            {deliveries.length === 0 && (
                              <p className="px-5 py-10 text-center text-base text-slate-600">Nenhuma entrega registrada para este produtor.</p>
                            )}
                          </div>

                          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
                            <table className="w-full text-base">
                              <thead>
                                <tr className="border-b border-slate-300 text-left text-sm font-semibold text-slate-600">
                                  <th scope="col" className="px-4 py-3">Data</th>
                                  <th scope="col" className="px-4 py-3">Mercadorias</th>
                                  <th scope="col" className="px-4 py-3 text-right">Cx 6424</th>
                                  <th scope="col" className="px-4 py-3 text-right">Papelão</th>
                                  <th scope="col" className="px-4 py-3">Pagamento ao produtor</th>
                                  <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {deliveries.map((delivery) => (
                                  <tr key={delivery.id} className="align-top transition-colors hover:bg-slate-50">
                                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                                      {new Date(delivery.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                    </td>
                                    <td className="px-4 py-4"><DeliveryItems delivery={delivery} /></td>
                                    <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-900">{deliveryVales(delivery)}</td>
                                    <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-900">
                                      {delivery.mercadorias.reduce((s, m) => s + m.quantidadePapelao, 0)}
                                    </td>
                                    <td className="px-4 py-4 text-sm"><DeliveryPayment delivery={delivery} /></td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button size="sm" variant="outline" onClick={(e) => handleQuitarDelivery(supplier, delivery, e)}>
                                          Quitar
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          aria-label="Editar entrega"
                                          title="Editar"
                                          onClick={(e) => openEditDeliveryModal(supplier, delivery, e)}
                                        >
                                          <Edit aria-hidden />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          aria-label="Excluir entrega"
                                          title="Excluir"
                                          className="text-red-700 hover:bg-red-50"
                                          onClick={(e) => handleDeleteDelivery(delivery.id!, supplier.id, e)}
                                        >
                                          <Trash2 aria-hidden />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}

                                {deliveries.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-base text-slate-600">
                                      Nenhuma entrega registrada para este produtor.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}

                {suppliers.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-16 text-slate-400">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-40 text-slate-400" />
                      <p className="font-semibold text-base">Nenhum produtor rural cadastrado.</p>
                      <p className="text-xs text-slate-400 mt-1">Cadastre seus parceiros para começar a gerenciar os hortifrútis recebidos.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION 3: ESTOQUE DO DIA & COMPARATIVO ================= */}
          {activeSection === "estoque" && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                
                {/* Consolidado do Dia Column */}
                <Card className="border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" /> Mercadorias Recebidas (Data Selecionada)
                    </CardTitle>
                    <p className="text-xs text-slate-500">Produtos entregues pelos produtores em {selectedDate}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-left">Mercadoria</th>
                            <th className="px-6 py-3 text-center">Total Caixas</th>
                            <th className="px-6 py-3 text-center">Papelão</th>
                            <th className="px-6 py-3 text-center">Modelo 6424</th>
                            <th className="px-6 py-3 text-left">Produtores</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {Object.entries(dailyDeliveries).map(([name, data]) => (
                            <tr key={name} className="hover:bg-slate-50/40">
                              <td className="px-6 py-4 font-bold text-slate-800">{name}</td>
                              <td className="px-6 py-4 text-center font-semibold text-slate-900">{data.total}</td>
                              <td className="px-6 py-4 text-center text-amber-800 font-semibold">{data.papelao || "-"}</td>
                              <td className="px-6 py-4 text-center text-emerald-800 font-semibold">{data.caixa6424 || "-"}</td>
                              <td className="px-6 py-4 text-xs text-slate-600 font-semibold">
                                {Array.from(data.suppliers).join(", ")}
                              </td>
                            </tr>
                          ))}

                          {Object.keys(dailyDeliveries).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-slate-400">
                                Nenhuma entrega registrada para a data de {selectedDate}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Received vs Sold Comparative Column */}
                <Card className="border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" /> Comparativo: Recebido vs Vendido
                    </CardTitle>
                    <p className="text-xs text-slate-500">Checagem de fechamento diário entre entradas e saídas.</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-left">Mercadoria</th>
                            <th className="px-6 py-3 text-center">Recebido</th>
                            <th className="px-6 py-3 text-center">Vendido</th>
                            <th className="px-6 py-3 text-center">Saldo Restante</th>
                            <th className="px-6 py-3 text-center">Status Estoque</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {Array.from(
                            new Set([...Object.keys(dailyDeliveries), ...Object.keys(dailySales)])
                          ).sort().map((name) => {
                            const recebido = dailyDeliveries[name]?.total || 0
                            const vendido = dailySales[name] || 0
                            const saldo = recebido - vendido

                            let badgeClass = "bg-slate-100 text-slate-700 border-slate-200"
                            let statusText = "Zerado"

                            if (saldo > 0) {
                              badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200"
                              statusText = "Em Estoque"
                            } else if (saldo < 0) {
                              badgeClass = "bg-rose-100 text-rose-800 border-rose-200"
                              statusText = "Faltando"
                            }

                            return (
                              <tr key={name} className="hover:bg-slate-50/40">
                                <td className="px-6 py-4 font-bold text-slate-800">{name}</td>
                                <td className="px-6 py-4 text-center font-semibold text-slate-600">{recebido} caixas</td>
                                <td className="px-6 py-4 text-center font-semibold text-slate-600">{vendido} caixas</td>
                                <td className={`px-6 py-4 text-center font-semibold ${saldo > 0 ? "text-emerald-600" : (saldo < 0 ? "text-rose-600" : "text-slate-500")}`}>
                                  {saldo > 0 ? `+${saldo}` : saldo}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                                    {statusText}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}

                          {Object.keys(dailyDeliveries).length === 0 && Object.keys(dailySales).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-slate-400">
                                Sem movimentações de compras ou vendas nesta data.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}

          {/* ================= SECTION 4: CONTROLE DE CAIXAS 6424 ================= */}
          {activeSection === "caixas" && (
            <div className="space-y-8">
              
              {/* Box Logistics Stats Cards */}
              <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-white md:grid-cols-3">
                <div className="border-b border-slate-200 px-4 py-4 sm:px-5 md:border-b-0 md:border-r">
                  <dt className="text-sm text-slate-600">Caixas 6424 recebidas</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{totalDeliveredSupplierBoxes6424}</dd>
                  <p className="text-sm text-slate-600">Entregas de fornecedores (histórico)</p>
                </div>
                <div className="border-b border-slate-200 px-4 py-4 sm:px-5 md:border-b-0 md:border-r">
                  <dt className="text-sm text-slate-600">Caixas devendo (clientes)</dt>
                  <dd className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${totalBoxesOwedByClients > 0 ? "text-red-700" : "text-slate-900"}`}>{totalBoxesOwedByClients}</dd>
                  <p className="text-sm text-slate-600">Lançadas em vendas de hoje</p>
                </div>
                <div className="px-4 py-4 sm:px-5">
                  <dt className="text-sm text-slate-600">Caixas pagas com vale</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-emerald-700">{totalBoxesPagasByClients}</dd>
                  <p className="text-sm text-slate-600">Vales de caixa quitados hoje</p>
                </div>
              </dl>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                
                {/* Supplier Crate Balances */}
                <Card className="border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-emerald-600" /> Saldo de Caixas por Produtor
                    </CardTitle>
                    <p className="text-xs text-slate-500">Cesta de caixas plásticas retornáveis 6424 deixadas por fornecedor.</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-left">Fornecedor</th>
                            <th className="px-6 py-3 text-center">Caixas 6424 Deixadas</th>
                            <th className="px-6 py-3 text-center">Caixas Papelão Deixadas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {Object.entries(supplierBoxTotals).map(([name, data]) => (
                            <tr key={name} className="hover:bg-slate-50/40">
                              <td className="px-6 py-4 font-bold text-slate-800">{name}</td>
                              <td className="px-6 py-4 text-center font-semibold text-emerald-700">{data.total6424}</td>
                              <td className="px-6 py-4 text-center font-semibold text-slate-500">{data.totalPapelao}</td>
                            </tr>
                          ))}

                          {Object.keys(supplierBoxTotals).length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-center py-10 text-slate-400">
                                Sem fornecedores cadastrados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Vales devidos por Clientes */}
                <Card className="border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500" /> Vales Caixas Devidos por Clientes (Histórico)
                    </CardTitle>
                    <p className="text-xs text-slate-500">Rastreamento de embalagens 6424 devidas para controle de vasilhames - dados históricos completos.</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-left">Cliente</th>
                            <th className="px-6 py-3 text-center">Data</th>
                            <th className="px-6 py-3 text-center">Total Caixas 6424</th>
                            <th className="px-6 py-3 text-center">Vales Devidos</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {allSales.filter(s => s.caixasDevendoVale > 0).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/40">
                              <td className="px-6 py-4 font-bold text-slate-800">{sale.cliente}</td>
                              <td className="px-6 py-4 text-center text-slate-600">{new Date(sale.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                              <td className="px-6 py-4 text-center font-semibold text-slate-600">{sale.qtdeCaixas6424}</td>
                              <td className="px-6 py-4 text-center font-semibold text-rose-600">{sale.caixasDevendoVale} caixas</td>
                              <td className="px-6 py-4 text-center">
                                <Button
                                  size="sm"
                                  onClick={() => openReturnBoxModal(sale)}
                                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 h-8"
                                >
                                  Baixar Vale
                                </Button>
                              </td>
                            </tr>
                          ))}

                          {allSales.filter(s => s.caixasDevendoVale > 0).length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-slate-400">
                                Excelente! Nenhum cliente tem pendências de devolução de caixas 6424.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL: NOVA / EDITAR VENDA ================= */}
      <Dialog open={saleModalOpen} onOpenChange={setSaleModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl text-emerald-950 font-bold">
              {editingSale ? `Editar Lançamento de Venda` : `Registrar Nova Venda`}
            </DialogTitle>
            <p className="text-sm text-slate-600">Data do lançamento: {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR") : ""}</p>
          </DialogHeader>

          <form onSubmit={handleSaleSubmit} className="space-y-6 py-4">
            
            <div className="space-y-2 relative">
              <div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="sale-cliente" className="text-emerald-950">Cliente</Label><div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" size="sm" onClick={setUnknownCustomer}>Cliente desconhecido</Button><Button type="button" variant="outline" size="sm" onClick={() => { setQuickCustomerForm({ nome: saleCustomerQuery, telefone: "", cpfCnpj: "", localizacao: "", observacoes: "" }); setCustomerModalOpen(true) }}><Plus className="w-4 h-4 mr-1" />Cadastrar rápido</Button></div></div>
              <div className="relative">
                <Input
                  id="sale-cliente"
                  className="pr-12"
                  value={saleCustomerQuery}
                  onChange={(e) => { setMostrarTodosClientes(false); setSaleCustomerQuery(e.target.value); setSaleCustomerId(null); setSaleFormData({ ...saleFormData, cliente: e.target.value }) }}
                  onFocus={() => loadCustomers(saleCustomerQuery)}
                  onKeyDown={(e) => { if (e.key === "Escape" && mostrarTodosClientes) { e.stopPropagation(); setMostrarTodosClientes(false) } }}
                  placeholder="Pesquise pelo nome do cliente"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={alternarListaClientes}
                  aria-label={mostrarTodosClientes ? "Fechar a lista de clientes" : "Ver todos os clientes"}
                  aria-expanded={mostrarTodosClientes}
                  aria-controls="lista-clientes"
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <ChevronDown className={`h-5 w-5 transition-transform duration-150 ${mostrarTodosClientes ? "rotate-180" : ""}`} aria-hidden />
                </button>

                {(mostrarTodosClientes || (!saleCustomerId && saleCustomerQuery !== "Cliente desconhecido" && saleCustomerQuery.trim() !== "")) && (() => {
                  const lista = mostrarTodosClientes
                    ? [...customers].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                    : customers.filter((c) => c.nome.toLowerCase().includes(saleCustomerQuery.toLowerCase())).slice(0, 8)
                  return (
                    <div id="lista-clientes" className="absolute left-0 top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {lista.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="flex min-h-12 w-full flex-col items-start justify-center px-3 py-2 text-left text-base hover:bg-emerald-50"
                          onClick={() => selectSaleCustomer(customer)}
                        >
                          <strong className="font-semibold text-slate-900">{customer.nome}</strong>
                          {(customer.telefone || customer.localizacao) && (
                            <span className="text-sm text-slate-600">{[customer.telefone, customer.localizacao].filter(Boolean).join(" · ")}</span>
                          )}
                        </button>
                      ))}
                      {lista.length === 0 && (
                        <p className="px-3 py-3 text-sm text-slate-600">
                          {mostrarTodosClientes ? "Nenhum cliente cadastrado ainda. Use “Cadastrar rápido”." : "Nenhum cadastro encontrado. Use “Cadastrar rápido”."}
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
              {saleCustomerId && <p className="text-xs font-semibold text-emerald-700">Cliente cadastrado selecionado.</p>}
            </div>

            {/* Hortifruti list items dynamic input table */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-emerald-950">Mercadorias Hortifruti</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSaleProductItem}
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Hortifruti
                </Button>
              </div>

              <div className="space-y-3">
                {saleProducts.map((prod, idx) => (
                  <Card key={idx} className="border border-green-100 shadow-sm bg-slate-50/50">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Mercadoria</Label>
                          <Select value={prod.nome || undefined} onValueChange={(v) => updateSaleProductItem(idx, "nome", v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione a mercadoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {prod.nome && !merchandises.some((m) => m.nome === prod.nome) && (
                                <SelectItem value={prod.nome}>{prod.nome}</SelectItem>
                              )}
                              {merchandises.map((m) => (
                                <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Quantidade (Caixas)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={prod.qtde || ""}
                            onChange={(e) => updateSaleProductItem(idx, "qtde", parseInt(e.target.value) || 0)}
                            placeholder="Ex: 10"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Valor Unitário (R$), pode ficar em branco</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={prod.valor || ""}
                            onChange={(e) => updateSaleProductItem(idx, "valor", parseFloat(e.target.value) || 0)}
                            placeholder="A definir"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSaleProductItem(idx)}
                        disabled={saleProducts.length <= 1}
                        className="h-9 w-9 self-end sm:self-auto shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Packaging and Crate 6424 control */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label htmlFor="sale-packaging" className="text-emerald-950">Modelo de Caixa</Label>
                <Select
                  value={saleFormData.modeloCaixa}
                  onValueChange={(val) => setSaleFormData({ ...saleFormData, modeloCaixa: val })}
                >
                  <SelectTrigger id="sale-packaging">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Papelão">Papelão (Descartável)</SelectItem>
                    <SelectItem value="6424">Modelo 6424 (Plástico)</SelectItem>
                    <SelectItem value="Misto">Misto (Papelão + 6424)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(saleFormData.modeloCaixa === "6424" || saleFormData.modeloCaixa === "Misto") && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">
                      Qtd Caixas 6424{saleFormData.modeloCaixa === "6424" ? " (automático)" : ""}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={totalCaixasVenda}
                      readOnly={saleFormData.modeloCaixa === "6424"}
                      className={saleFormData.modeloCaixa === "6424" ? "bg-slate-100" : undefined}
                      value={saleFormData.qtdeCaixas6424 || ""}
                      onChange={(e) => setSaleFormData({ ...saleFormData, qtdeCaixas6424: Math.min(parseInt(e.target.value) || 0, totalCaixasVenda) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Pagas (Vale)</Label>
                    <Input
                      type="number"
                      min="0"
                      max={saleFormData.qtdeCaixas6424}
                      value={saleFormData.caixasPagasVale || ""}
                      onChange={(e) => setSaleFormData({ ...saleFormData, caixasPagasVale: Math.min(parseInt(e.target.value) || 0, saleFormData.qtdeCaixas6424) })}
                    />
                  </div>
                  <div className="col-span-2 text-xs font-bold text-rose-600">
                    Devendo: {Math.max(0, saleFormData.qtdeCaixas6424 - saleFormData.caixasPagasVale)} caixas
                  </div>
                </div>
              )}
            </div>

            {/* Hortifruti Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label htmlFor="sale-payment" className="text-emerald-950">Pagamento das Verduras</Label>
                <Select
                  value={vendaSemPreco ? "Devendo" : saleFormData.pagamentoVerduras}
                  onValueChange={(val) => setSaleFormData({ ...saleFormData, pagamentoVerduras: val })}
                  disabled={vendaSemPreco}
                >
                  <SelectTrigger id="sale-payment">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago Integralmente</SelectItem>
                    <SelectItem value="Parcial">Pago Parcialmente</SelectItem>
                    <SelectItem value="Devendo">Ficou Devendo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {vendaSemPreco && (
                <p className="text-sm text-amber-700 md:col-span-2">
                  Sem preço informado, a venda fica como &ldquo;Devendo&rdquo; até você editar e definir o valor.
                </p>
              )}

              {!vendaSemPreco && saleFormData.pagamentoVerduras === "Parcial" && (
                <div className="space-y-1.5">
                  <Label htmlFor="sale-pago" className="text-emerald-950">Valor Pago Adiantado (R$)</Label>
                  <Input
                    id="sale-pago"
                    type="number"
                    step="0.01"
                    min="0"
                    value={saleFormData.valorPago || ""}
                    onChange={(e) => setSaleFormData({ ...saleFormData, valorPago: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              className="w-full mt-6"
            >
              Salvar Lançamento de Venda
            </Button>

          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6"><DialogHeader><DialogTitle>Novo cliente rápido</DialogTitle></DialogHeader><form onSubmit={handleQuickCustomerSubmit} className="space-y-3 py-2"><div><Label>Nome *</Label><Input autoFocus value={quickCustomerForm.nome} onChange={e => setQuickCustomerForm({ ...quickCustomerForm, nome: e.target.value })} required /></div><div><Label>Telefone</Label><Input value={quickCustomerForm.telefone} onChange={e => setQuickCustomerForm({ ...quickCustomerForm, telefone: e.target.value })} /></div><div><Label>CPF/CNPJ</Label><Input value={quickCustomerForm.cpfCnpj} onChange={e => setQuickCustomerForm({ ...quickCustomerForm, cpfCnpj: e.target.value })} /></div><Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Cadastrar e selecionar</Button></form></DialogContent>
      </Dialog>

      <Dialog open={selectedCustomer !== null} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6"><DialogHeader><DialogTitle>{selectedCustomer?.id ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>{selectedCustomer && <form onSubmit={(e) => saveCustomer(selectedCustomer, e)} className="space-y-3 py-2"><div><Label>Nome *</Label><Input value={selectedCustomer.nome} onChange={e => setSelectedCustomer({ ...selectedCustomer, nome: e.target.value })} required /></div><div className="grid grid-cols-2 gap-3"><div><Label>Telefone</Label><Input value={selectedCustomer.telefone || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, telefone: e.target.value })} /></div><div><Label>CPF/CNPJ</Label><Input value={selectedCustomer.cpfCnpj || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, cpfCnpj: e.target.value })} /></div></div><div><Label>Localização</Label><Input value={selectedCustomer.localizacao || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, localizacao: e.target.value })} placeholder="Ex: Box 12, Rua B" /></div><div><Label>Observações</Label><textarea className="w-full min-h-20 border rounded-md p-2" value={selectedCustomer.observacoes || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, observacoes: e.target.value })} /></div><Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Salvar cliente</Button></form>}</DialogContent>
      </Dialog>

      {/* ================= MODAL: NOVA / EDITAR MERCADORIA ================= */}
      <Dialog open={merchandiseModalOpen} onOpenChange={setMerchandiseModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingMerchandise ? "Editar mercadoria" : "Nova mercadoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMerchandiseSubmit} className="space-y-3 py-2">
            <div>
              <Label htmlFor="merc-nome">Nome *</Label>
              <Input id="merc-nome" value={merchandiseName} onChange={(e) => setMerchandiseName(e.target.value)} placeholder="Ex: Tomate cereja" required />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Salvar mercadoria</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: NOVO / EDITAR PRODUTOR ================= */}
      <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl text-emerald-950 font-bold">
              {editingSupplier ? "Editar Cadastro de Produtor" : "Cadastrar Produtor Rural"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSupplierSubmit} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="sup-nome">Nome do Produtor</Label>
              <Input
                id="sup-nome"
                value={supplierFormData.nome}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, nome: e.target.value })}
                placeholder="Ex: Sítio São José - Seu João"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sup-ceasa">Área / Box no CEASA</Label>
              <Input
                id="sup-ceasa"
                value={supplierFormData.areaCeasa}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, areaCeasa: e.target.value })}
                placeholder="Ex: Pavilhão 2, Box 15"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
            >
              Salvar Cadastro
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: REGISTRAR / EDITAR ENTREGA ================= */}
      <Dialog open={deliveryModalOpen} onOpenChange={deliveryModalOpenStateChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl text-emerald-950 font-bold">
              {editingDelivery ? "Editar Lançamento de Entrega" : "Registrar Entrega de Mercadorias"}
            </DialogTitle>
            <p className="text-sm font-medium text-slate-600">
              Produtor: <span className="text-emerald-700 font-semibold">{selectedSupplier?.nome}</span>
            </p>
          </DialogHeader>

          <form onSubmit={handleDeliverySubmit} className="space-y-6 py-4">
            
            <div className="space-y-1.5">
              <Label htmlFor="del-date">Data da Entrega</Label>
              <Input
                id="del-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>

            {/* Hortifruti deliveries dynamic input list */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-emerald-950 font-bold">Hortifrútis Entregues</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDeliveryProductItem}
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Hortifruti
                </Button>
              </div>

              <div className="space-y-3">
                {deliveryProducts.map((prod, idx) => (
                  <Card key={idx} className="border border-green-100 shadow-sm bg-slate-50/50">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Mercadoria</Label>
                          <Select value={prod.nomeMercadoria || undefined} onValueChange={(v) => updateDeliveryProductItem(idx, "nomeMercadoria", v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione a mercadoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {prod.nomeMercadoria && !merchandises.some((m) => m.nome === prod.nomeMercadoria) && (
                                <SelectItem value={prod.nomeMercadoria}>{prod.nomeMercadoria}</SelectItem>
                              )}
                              {merchandises.map((m) => (
                                <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Caixas 6424 (Plástico)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={prod.quantidadeCaixa6424 || ""}
                            onChange={(e) => updateDeliveryProductItem(idx, "quantidadeCaixa6424", parseInt(e.target.value) || 0)}
                            placeholder="Ex: 20"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Caixas Papelão</Label>
                          <Input
                            type="number"
                            min="0"
                            value={prod.quantidadePapelao || ""}
                            onChange={(e) => updateDeliveryProductItem(idx, "quantidadePapelao", parseInt(e.target.value) || 0)}
                            placeholder="Ex: 5"
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeDeliveryProductItem(idx)}
                        disabled={deliveryProducts.length <= 1}
                        className="h-11 w-11 self-end sm:self-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-emerald-950 font-bold">Pagamento ao Produtor</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="del-total" className="text-xs text-slate-500">Valor total (R$)</Label>
                  <Input id="del-total" type="number" min="0" step="0.01" value={deliveryValorTotal} onChange={(e) => setDeliveryValorTotal(e.target.value)} placeholder="Ex: 1500.00" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="del-pago" className="text-xs text-slate-500">Já pago em dinheiro (R$)</Label>
                  <Input id="del-pago" type="number" min="0" step="0.01" value={deliveryValorPago} onChange={(e) => setDeliveryValorPago(e.target.value)} placeholder="Ex: 500.00" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="del-vales" className="text-xs text-slate-500">Vales de cxs pagos (qtde)</Label>
                  <Input id="del-vales" type="number" min="0" value={deliveryValesPagos} onChange={(e) => setDeliveryValesPagos(e.target.value)} placeholder="Ex: 10" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
            >
              Registrar Lançamento de Entrega
            </Button>

          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: QUICK DEVOLVER VALES CAIXAS ================= */}
      <Dialog open={returnBoxModalOpen} onOpenChange={setReturnBoxModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl text-emerald-950 font-bold flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-600" /> Registrar Devolução de Caixas 6424
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">Cliente: <span className="font-bold text-slate-800">{selectedSaleForReturn?.cliente}</span></p>
          </DialogHeader>

          <form onSubmit={handleReturnBoxSubmit} className="space-y-4 py-4">
            <div className="space-y-1 bg-rose-50 p-3 rounded-lg border border-rose-100 text-xs font-bold text-rose-700">
              Total de Vales em Aberto: {selectedSaleForReturn?.caixasDevendoVale} caixas plásticas.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ret-amount">Quantidade de Caixas Devolvidas</Label>
              <Input
                id="ret-amount"
                type="number"
                min="1"
                max={selectedSaleForReturn?.caixasDevendoVale}
                value={boxReturnAmount || ""}
                onChange={(e) => setBoxReturnAmount(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
            >
              Confirmar Devolução
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
    </ProtectedRoute>
  )
}
