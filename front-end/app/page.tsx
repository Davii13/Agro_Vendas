"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LogoutButton } from "@/components/LogoutButton"
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
  Warehouse,
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
} from "lucide-react"
import * as XLSX from "xlsx"

// Backend API Base Configuration
const API_BASE = "http://localhost:8080/api"

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
  email?: string | null
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
  mercadorias: DeliveryProduct[]
}

type Supplier = {
  id: number
  nome: string
  areaCeasa: string
}

export default function AgroVendasPage() {
  // Date and Section State
  const [selectedDate, setSelectedDate] = useState("")
  const [activeSection, setActiveSection] = useState("vendas")

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
  const [saleCustomerId, setSaleCustomerId] = useState<number | null>(null)
  const [quickCustomerForm, setQuickCustomerForm] = useState({ nome: "", telefone: "", cpfCnpj: "", email: "", observacoes: "" })
  const [saleProducts, setSaleProducts] = useState<ProductItem[]>([])

  const [supplierFormData, setSupplierFormData] = useState({
    nome: "",
    areaCeasa: "",
  })

  const [deliveryProducts, setDeliveryProducts] = useState<DeliveryProduct[]>([])
  const [deliveryDate, setDeliveryDate] = useState("")

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
      const res = await fetch(`${API_BASE}/vendas?data=${date}`)
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
      const res = await fetch(`${API_BASE}/vendas`)
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
      const res = await fetch(`${API_BASE}/fornecedores`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      }
    } catch (e) {
      console.error("Erro de conexão ao buscar fornecedores:", e)
    }
  }, [])

  const loadCustomers = useCallback(async (search = "") => {
    try {
      const res = await fetch(`${API_BASE}/clientes${search ? `?busca=${encodeURIComponent(search)}` : ""}`)
      if (res.ok) setCustomers(await res.json())
    } catch (e) { console.error("Erro ao buscar clientes:", e) }
  }, [])

  const loadCustomerDetails = async (id: number) => {
    const res = await fetch(`${API_BASE}/clientes/${id}`)
    if (res.ok) setCustomerDetails(await res.json())
  }

  // Load Deliveries for specific supplier
  const loadSupplierDeliveries = useCallback(async (supplierId: number) => {
    try {
      const res = await fetch(`${API_BASE}/fornecedores/${supplierId}/entregas`)
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
    loadAllSales()
  }, [selectedDate, loadSales, loadSuppliers, loadCustomers, loadAllSales])

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

    // Auto-calculate crates owed for model 6424
    let calculatedOwed = 0
    if (saleFormData.modeloCaixa === "6424" || saleFormData.modeloCaixa === "Misto") {
      calculatedOwed = Math.max(0, saleFormData.qtdeCaixas6424 - saleFormData.caixasPagasVale)
    }

    const payload: Sale = {
      id: editingSale?.id || undefined,
      data: selectedDate,
      cliente: saleFormData.cliente,
      clienteId: saleCustomerId,
      modeloCaixa: saleFormData.modeloCaixa,
      qtdeCaixas6424: saleFormData.modeloCaixa !== "Papelão" ? saleFormData.qtdeCaixas6424 : 0,
      caixasPagasVale: saleFormData.modeloCaixa !== "Papelão" ? saleFormData.caixasPagasVale : 0,
      caixasDevendoVale: calculatedOwed,
      pagamentoVerduras: saleFormData.pagamentoVerduras,
      valorPago: saleFormData.pagamentoVerduras === "Parcial" ? saleFormData.valorPago : (saleFormData.pagamentoVerduras === "Pago" ? 99999 : 0), // Note: standard handling
      mercadorias: saleProducts,
    }

    try {
      const res = await fetch(`${API_BASE}/vendas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSaleModalOpen(false)
        loadSales(selectedDate)
      } else {
        alert("Erro ao salvar a venda.")
      }
    } catch (err) {
      console.error(err)
      alert("Erro de conexão ao salvar a venda.")
    }
  }

  const selectSaleCustomer = (customer: Customer) => {
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
    const res = await fetch(`${API_BASE}/clientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(quickCustomerForm) })
    if (!res.ok) { alert("Não foi possível cadastrar o cliente."); return }
    const customer: Customer = await res.json()
    selectSaleCustomer(customer)
    setCustomerModalOpen(false)
    setQuickCustomerForm({ nome: "", telefone: "", cpfCnpj: "", email: "", observacoes: "" })
    loadCustomers()
  }

  const saveCustomer = async (customer: Customer, e: React.FormEvent) => {
    e.preventDefault()
    const method = customer.id ? "PUT" : "POST"
    const url = customer.id ? `${API_BASE}/clientes/${customer.id}` : `${API_BASE}/clientes`
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(customer) })
    if (res.ok) { setSelectedCustomer(null); loadCustomers(customerSearch) } else alert("Erro ao salvar cliente.")
  }

  const deleteCustomer = async (id: number) => {
    if (!confirm("Excluir este cliente? As vendas permanecerão registradas, mas sem vínculo ao cadastro.")) return
    const res = await fetch(`${API_BASE}/clientes/${id}`, { method: "DELETE" })
    if (res.ok) { setCustomerDetails(null); loadCustomers(customerSearch) }
  }

  const generateHistoryHTML = () => {
    if (!customerDetails) return ""
    const totalVendas = customerDetails.vendas.length
    const totalValor = customerDetails.vendas.reduce((sum, sale) => sum + sale.mercadorias.reduce((total, m) => total + m.qtde * m.valor, 0), 0)

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
        <h1 style="color: #1e3a1f; text-align: center; margin-bottom: 30px;">Histórico de Compras</h1>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #047857; margin: 0 0 10px 0; font-size: 16px;">Cliente: ${customerDetails.cliente.nome}</h2>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Telefone:</strong> ${customerDetails.cliente.telefone || "N/A"}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Email:</strong> ${customerDetails.cliente.email || "N/A"}</p>
          <p style="margin: 5px 0; font-size: 13px;"><strong>Observações:</strong> ${customerDetails.cliente.observacoes || "N/A"}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1e3a1f; border-bottom: 2px solid #047857; padding-bottom: 10px;">Resumo</h3>
          <p style="font-size: 14px;"><strong>Total de Compras:</strong> ${totalVendas}</p>
          <p style="font-size: 14px;"><strong>Valor Total:</strong> R$ ${totalValor.toFixed(2)}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3 style="color: #1e3a1f; border-bottom: 2px solid #047857; padding-bottom: 10px;">Detalhes das Compras</h3>
          ${customerDetails.vendas.map(sale => {
            const saleTotal = sale.mercadorias.reduce((total, m) => total + m.qtde * m.valor, 0)
            return `
              <div style="border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <strong style="color: #1e3a1f;">${new Date(sale.data + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
                  <span style="background: ${sale.pagamentoVerduras === "Pago" ? "#dcfce7" : sale.pagamentoVerduras === "Parcial" ? "#fef3c7" : "#fee2e2"}; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">${sale.pagamentoVerduras}</span>
                </div>
                <p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Modelo de Caixa:</strong> ${sale.modeloCaixa}</p>
                <p style="margin: 5px 0; font-size: 13px; color: #555;">${sale.mercadorias.map(m => `${m.nome} (${m.qtde})`).join(", ")}</p>
                ${sale.modeloCaixa !== "Papelão" ? `
                  <div style="background: #f0fdf4; padding: 8px; border-left: 3px solid #047857; margin: 8px 0; border-radius: 3px;">
                    <p style="margin: 3px 0; font-size: 12px;"><strong>Caixas 6424:</strong> ${sale.qtdeCaixas6424}</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong>Pagas (Vale):</strong> ${sale.caixasPagasVale}</p>
                    <p style="margin: 3px 0; font-size: 12px;"><strong style="color: ${sale.caixasDevendoVale > 0 ? "#dc2626" : "#059669"};">Devendo:</strong> ${sale.caixasDevendoVale}</p>
                  </div>
                ` : ""}
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
                  <div>
                    <p style="margin: 5px 0; font-size: 13px; font-weight: bold; color: #047857;">Total: R$ ${saleTotal.toFixed(2)}</p>
                    ${sale.pagamentoVerduras === "Parcial" ? `<p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Valor Pago:</strong> R$ ${sale.valorPago.toFixed(2)}</p><p style="margin: 5px 0; font-size: 12px; color: #dc2626;"><strong>Valor Pendente:</strong> R$ ${(saleTotal - sale.valorPago).toFixed(2)}</p>` : ""}
                  </div>
                </div>
              </div>
            `
          }).join("")}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 11px; color: #666;">
          <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
        </div>
      </div>
    `
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
      const res = await fetch(`${API_BASE}/vendas/${id}`, {
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
    const url = editingSupplier ? `${API_BASE}/fornecedores/${editingSupplier.id}` : `${API_BASE}/fornecedores`

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${API_BASE}/fornecedores/${id}`, {
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

  // ================= SUPPLIER DELIVERIES OPERATIONS =================

  const openNewDeliveryModal = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setEditingDelivery(null)
    setDeliveryDate(selectedDate || new Date().toISOString().split("T")[0])
    setDeliveryProducts([{ nomeMercadoria: "", quantidadeCaixa6424: 0, quantidadePapelao: 0 }])
    deliveryModalOpenStateChange(true)
  }

  const openEditDeliveryModal = (supplier: Supplier, delivery: Delivery, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setEditingDelivery(delivery)
    setDeliveryDate(delivery.data)
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
      mercadorias: deliveryProducts,
    }

    try {
      const res = await fetch(`${API_BASE}/fornecedores/${selectedSupplier.id}/entregas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setDeliveryModalOpen(false)
        loadSupplierDeliveries(selectedSupplier.id)
        refreshAll()
      } else {
        alert("Erro ao salvar entrega.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteDelivery = async (deliveryId: number, supplierId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Excluir esta entrega?")) return
    try {
      const res = await fetch(`${API_BASE}/entregas/${deliveryId}`, {
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
      const res = await fetch(`${API_BASE}/vendas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSale),
      })

      if (res.ok) {
        setReturnBoxModalOpen(false)
        loadSales(selectedDate)
        loadAllSales()
      } else {
        alert("Erro ao registrar devolução.")
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

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
        {/* Sidebar Dashboard Navigation */}
        <aside className="w-68 bg-gradient-to-b from-emerald-900 via-green-950 to-emerald-950 text-white p-6 flex flex-col shadow-2xl shrink-0">
          <div className="mb-10 pb-4 border-b border-emerald-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">AgroVendas</h1>
                <p className="text-emerald-300 text-xs font-semibold tracking-wider uppercase">CEASA Hortifruti</p>
              </div>
            </div>
          </div>

          <div className="mb-4 pb-4 border-b border-emerald-800/60">
            <p className="text-emerald-100 text-sm">Olá, <strong>{user?.nome}</strong></p>
            <p className="text-emerald-300 text-xs">{user?.email}</p>
          </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveSection("vendas")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeSection === "vendas"
                ? "bg-white text-emerald-900 shadow-md shadow-emerald-900/10 font-bold scale-[1.02]"
                : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Planilha de Vendas</span>
          </button>

          <button
            onClick={() => setActiveSection("fornecedores")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeSection === "fornecedores"
                ? "bg-white text-emerald-900 shadow-md shadow-emerald-900/10 font-bold scale-[1.02]"
                : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
            }`}
          >
            <Truck className="w-5 h-5" />
            <span>Gestão de Entregas</span>
          </button>

          <button
            onClick={() => { setActiveSection("clientes"); loadCustomers() }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeSection === "clientes"
                ? "bg-white text-emerald-900 shadow-md shadow-emerald-900/10 font-bold scale-[1.02]"
                : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Clientes</span>
          </button>

          <button
            onClick={() => setActiveSection("estoque")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeSection === "estoque"
                ? "bg-white text-emerald-900 shadow-md shadow-emerald-900/10 font-bold scale-[1.02]"
                : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Estoque & Comparativo</span>
          </button>

          <button
            onClick={() => setActiveSection("caixas")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
              activeSection === "caixas"
                ? "bg-white text-emerald-900 shadow-md shadow-emerald-900/10 font-bold scale-[1.02]"
                : "text-emerald-100 hover:bg-emerald-800/40 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Controle de Caixas 6424</span>
          </button>
        </nav>

        {/* Global Connection Badge */}
        <div className="pt-4 border-t border-emerald-800/60 mt-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Banco Conectado</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Bar Header with Date Input */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Painel AgroVendas</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeSection === "vendas" && "Planilha de Vendas Diárias"}
                {activeSection === "fornecedores" && "Gestão de Entregas & Produtores"}
                {activeSection === "clientes" && "Cadastro de Clientes"}
                {activeSection === "estoque" && "Estoque Consolidado do Dia"}
                {activeSection === "caixas" && "Gestão de Caixas 6424"}
              </h2>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <Label htmlFor="global-date" className="text-xs font-bold text-slate-500 uppercase">Data Geral:</Label>
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
                className="text-sm font-semibold border-none text-slate-700 focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
          </header>

          {/* ================= SECTION 1: VENDAS DO DIA ================= */}
          {activeSection === "vendas" && (
            <div className="space-y-8">
              
              {/* Dashboard Indicator Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Vendas Feitas</span>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-slate-900">{totalSalesCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Registradas hoje</p>
                  </CardContent>
                </Card>

                <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Vendas Liquidadas</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-slate-900">{totalSalesPaid}</p>
                    <p className="text-xs text-slate-500 mt-1">Pagamento integral</p>
                  </CardContent>
                </Card>

                <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-rose-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Vendas em Aberto</span>
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-slate-900">{totalSalesOwing}</p>
                    <p className="text-xs text-slate-500 mt-1">Devendo ou Parciais</p>
                  </CardContent>
                </Card>

                <Card className="hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-emerald-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Volume de Vendas</span>
                      <Package className="w-4 h-4 text-emerald-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-slate-900">{totalBoxesSold}</p>
                    <p className="text-xs text-slate-500 mt-1">Caixas comercializadas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Sales Table List */}
              <Card className="shadow-lg border border-slate-100 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                  <div>
                    <CardTitle className="text-lg font-bold text-emerald-950">Planilha do Dia</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Vendas lançadas para {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR") : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={exportSalesToExcel}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                    >
                      <FileDown className="w-4 h-4 mr-2" /> Exportar Excel
                    </Button>
                    <Button
                      onClick={openNewSaleModal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md active:scale-95 duration-100 transition-all rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Nova Venda
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-left">Cliente</th>
                          <th className="px-6 py-4 text-left">Mercadorias / Hortifruti</th>
                          <th className="px-6 py-4 text-left">Modelo Caixa</th>
                          <th className="px-6 py-4 text-left">Caixas 6424 c/ Vale</th>
                          <th className="px-6 py-4 text-left">Vendas Status</th>
                          <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {sales.map((sale) => {
                          const totalBoxes = sale.mercadorias.reduce((s, m) => s + m.qtde, 0)
                          return (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-900">{sale.cliente}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  {sale.mercadorias.map((m, idx) => (
                                    <div key={idx} className="text-xs flex items-center gap-1.5 text-slate-600">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                      <span className="font-semibold text-slate-800">{m.nome}</span>: {m.qtde} caixas × R$ {m.valor.toFixed(2)}
                                    </div>
                                  ))}
                                  <div className="text-xs font-bold text-slate-800 pt-1">
                                    Total: {totalBoxes} caixas
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                  {sale.modeloCaixa}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {sale.modeloCaixa !== "Papelão" ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">{sale.caixasPagasVale} de {sale.qtdeCaixas6424} pagas</div>
                                    {sale.caixasDevendoVale > 0 ? (
                                      <span className="text-rose-600 font-bold flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Devendo {sale.caixasDevendoVale} caixas
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-bold flex items-center gap-1 mt-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Tudo devolvido
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-semibold text-xs">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPaymentBadge(sale.pagamentoVerduras)}`}>
                                  {sale.pagamentoVerduras === "Parcial" ? `Parcial (R$ ${sale.valorPago.toFixed(2)})` : sale.pagamentoVerduras}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  {sale.caixasDevendoVale > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReturnBoxModal(sale)}
                                      className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8"
                                    >
                                      Devolver Vales
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => openEditSaleModal(sale)}
                                    className="border-slate-200 hover:text-emerald-700 h-8 w-8 rounded-lg"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => handleDeleteSale(sale.id!)}
                                    className="h-8 w-8 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}

                        {sales.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-16 text-slate-400 bg-white">
                              <Package className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
                              <p className="font-semibold text-sm">Nenhuma venda registrada nesta data.</p>
                              <p className="text-xs text-slate-400 mt-1">Clique em "+ Nova Venda" para começar a registrar.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "clientes" && (
            <div className="space-y-6">
              <Card className="border-slate-100 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div><CardTitle>Clientes cadastrados</CardTitle><p className="text-sm text-slate-500 mt-1">Pesquise, mantenha os dados e consulte o histórico de compras.</p></div>
                  <Button onClick={() => setSelectedCustomer({ id: 0, nome: "", telefone: "", cpfCnpj: "", email: "", observacoes: "" })} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Novo cliente</Button>
                </CardHeader>
                <CardContent>
                  <Input value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); loadCustomers(e.target.value) }} placeholder="Buscar por nome..." className="mb-4" />
                  <div className="divide-y divide-slate-100">
                    {customers.map(customer => <div key={customer.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div><p className="font-bold text-slate-900">{customer.nome}</p><p className="text-sm text-slate-500">{customer.telefone || customer.email || "Sem contato informado"}</p></div>
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
                      <p className="text-sm text-slate-500 mt-1">{customerDetails.cliente.telefone || ""} {customerDetails.cliente.email ? `• ${customerDetails.cliente.email}` : ""}</p>
                    </div>
                    <div className="flex gap-2">
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

          {/* ================= SECTION 2: GESTÃO DE ENTREGAS & FORNECEDORES ================= */}
          {activeSection === "fornecedores" && (
            <div className="space-y-8">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Produtores Cadastrados</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Gerencie os fornecedores rurais e registre suas entregas de mercadorias no CEASA.</p>
                </div>
                
                <Button
                  onClick={openNewSupplierModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md active:scale-95 duration-100 transition-all rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" /> + Cadastrar Produtor
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
                        className="p-6 bg-gradient-to-r from-white to-slate-50/50 hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors border-b border-slate-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <UserCircle className="w-6 h-6 text-emerald-700" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-slate-900">{supplier.nome}</h4>
                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              Local CEASA: <span className="text-slate-700 font-bold">{supplier.areaCeasa}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 h-9 rounded-xl font-bold"
                            onClick={(e) => openNewDeliveryModal(supplier, e)}
                          >
                            + Lançar Entrega
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-slate-200 h-9 w-9 rounded-lg"
                            onClick={(e) => openEditSupplierModal(supplier, e)}
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-9 w-9 rounded-lg"
                            onClick={(e) => handleDeleteSupplier(supplier.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-slate-400 hover:text-slate-600"
                            onClick={() => toggleSupplier(supplier.id)}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Lieferungen history */}
                      {isExpanded && (
                        <div className="bg-slate-50/50 p-6 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                              <Truck className="w-4 h-4 text-emerald-600" /> Histórico de Entregas
                            </h5>
                            
                            <div className="flex items-center gap-6 text-xs font-bold text-slate-500">
                              <div>
                                Caixas 6424 Entregues: <span className="text-emerald-700 font-extrabold">{totals.total6424}</span>
                              </div>
                              <div>
                                Caixas Papelão Entregues: <span className="text-amber-800 font-extrabold">{totals.totalPapelao}</span>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                            <table className="w-full text-xs text-slate-600">
                              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="px-6 py-3 text-left">Data de Recebimento</th>
                                  <th className="px-6 py-3 text-left">Mercadoria Hortifruti</th>
                                  <th className="px-6 py-3 text-center">Caixas 6424</th>
                                  <th className="px-6 py-3 text-center">Caixas Papelão</th>
                                  <th className="px-6 py-3 text-center">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {deliveries.map((delivery) => (
                                  <tr key={delivery.id} className="hover:bg-slate-50/60">
                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                      {new Date(delivery.data + "T00:00:00").toLocaleDateString("pt-BR")}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="space-y-1">
                                        {delivery.mercadorias.map((m, idx) => (
                                          <div key={idx} className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="font-bold text-slate-800">{m.nomeMercadoria}</span>
                                            <span className="text-slate-400">
                                              ({m.quantidadeCaixa6424} mod. 6424, {m.quantidadePapelao} papelão)
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-emerald-800">
                                      {delivery.mercadorias.reduce((s, m) => s + m.quantidadeCaixa6424, 0)}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-amber-900">
                                      {delivery.mercadorias.reduce((s, m) => s + m.quantidadePapelao, 0)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          className="h-7 w-7 rounded-md border-slate-200"
                                          onClick={(e) => openEditDeliveryModal(supplier, delivery, e)}
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="destructive"
                                          className="h-7 w-7 rounded-md"
                                          onClick={(e) => handleDeleteDelivery(delivery.id!, supplier.id, e)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}

                                {deliveries.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-400">
                                      Nenhuma entrega registrada para este produtor rural.
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
                  <Card className="shadow-md">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Consolidado do Dia Column */}
                <Card className="shadow-lg border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-slate-50/50 p-6 border-b border-slate-100">
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
                              <td className="px-6 py-4 text-center font-extrabold text-slate-900">{data.total}</td>
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
                <Card className="shadow-lg border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-slate-50/50 p-6 border-b border-slate-100">
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
                                <td className={`px-6 py-4 text-center font-extrabold ${saldo > 0 ? "text-emerald-600" : (saldo < 0 ? "text-rose-600" : "text-slate-500")}`}>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-emerald-600 bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Total Caixas 6424 Recebidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-emerald-950">{totalDeliveredSupplierBoxes6424}</p>
                    <p className="text-xs text-slate-500 mt-1">Entregas de fornecedores (histórico)</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-500 bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Caixas Devendo (Clientes)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-rose-600">{totalBoxesOwedByClients}</p>
                    <p className="text-xs text-slate-500 mt-1">Lançadas em vendas de hoje</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Caixas Pagas/Vale
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-emerald-700">{totalBoxesPagasByClients}</p>
                    <p className="text-xs text-slate-500 mt-1">Vales caixas quitados hoje</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Supplier Crate Balances */}
                <Card className="shadow-lg border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-slate-50/50 p-6 border-b border-slate-100">
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
                              <td className="px-6 py-4 text-center font-extrabold text-emerald-700">{data.total6424}</td>
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
                <Card className="shadow-lg border border-slate-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-slate-50/50 p-6 border-b border-slate-100">
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
                              <td className="px-6 py-4 text-center font-extrabold text-rose-600">{sale.caixasDevendoVale} caixas</td>
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
            <p className="text-xs text-slate-400">Data de Lançamento: {selectedDate}</p>
          </DialogHeader>

          <form onSubmit={handleSaleSubmit} className="space-y-6 py-4">
            
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between"><Label htmlFor="sale-cliente" className="text-emerald-950">Cliente</Label><div className="flex gap-2"><Button type="button" variant="ghost" size="sm" onClick={setUnknownCustomer}>Cliente desconhecido</Button><Button type="button" variant="outline" size="sm" onClick={() => { setQuickCustomerForm({ nome: saleCustomerQuery, telefone: "", cpfCnpj: "", email: "", observacoes: "" }); setCustomerModalOpen(true) }}><Plus className="w-4 h-4 mr-1" />Cadastrar rápido</Button></div></div>
              <Input id="sale-cliente" value={saleCustomerQuery} onChange={(e) => { setSaleCustomerQuery(e.target.value); setSaleCustomerId(null); setSaleFormData({ ...saleFormData, cliente: e.target.value }) }} onFocus={() => loadCustomers(saleCustomerQuery)} placeholder="Pesquise pelo nome do cliente" autoComplete="off" />
              {!saleCustomerId && saleCustomerQuery !== "Cliente desconhecido" && saleCustomerQuery.trim() && <div className="absolute z-20 top-[76px] w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-auto">{customers.filter(c => c.nome.toLowerCase().includes(saleCustomerQuery.toLowerCase())).slice(0, 8).map(customer => <button key={customer.id} type="button" className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-sm" onClick={() => selectSaleCustomer(customer)}><strong>{customer.nome}</strong>{customer.telefone && <span className="text-slate-500 ml-2">{customer.telefone}</span>}</button>)}{customers.filter(c => c.nome.toLowerCase().includes(saleCustomerQuery.toLowerCase())).length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Nenhum cadastro encontrado. Use “Cadastrar rápido”.</p>}</div>}
              {saleCustomerId && <p className="text-xs font-semibold text-emerald-700">Cliente cadastrado selecionado.</p>}
            </div>

            {/* Hortifruti list items dynamic input table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
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
                    <CardContent className="p-4 flex gap-3 items-end">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Mercadoria</Label>
                          <Input
                            value={prod.nome}
                            onChange={(e) => updateSaleProductItem(idx, "nome", e.target.value)}
                            placeholder="Ex: Tomate cereja"
                            required
                          />
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
                          <Label className="text-xs text-slate-500">Valor Unitário (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={prod.valor || ""}
                            onChange={(e) => updateSaleProductItem(idx, "valor", parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 45.00"
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeSaleProductItem(idx)}
                        disabled={saleProducts.length <= 1}
                        className="h-9 w-9"
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
                    <Label className="text-xs text-slate-600">Qtd Caixas 6424</Label>
                    <Input
                      type="number"
                      min="0"
                      value={saleFormData.qtdeCaixas6424 || ""}
                      onChange={(e) => setSaleFormData({ ...saleFormData, qtdeCaixas6424: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Pagas (Vale)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={saleFormData.caixasPagasVale || ""}
                      onChange={(e) => setSaleFormData({ ...saleFormData, caixasPagasVale: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2 text-xs font-bold text-rose-600">
                    Owed (Devendo): {Math.max(0, saleFormData.qtdeCaixas6424 - saleFormData.caixasPagasVale)} caixas
                  </div>
                </div>
              )}
            </div>

            {/* Hortifruti Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label htmlFor="sale-payment" className="text-emerald-950">Pagamento das Verduras</Label>
                <Select
                  value={saleFormData.pagamentoVerduras}
                  onValueChange={(val) => setSaleFormData({ ...saleFormData, pagamentoVerduras: val })}
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

              {saleFormData.pagamentoVerduras === "Parcial" && (
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-500/10 mt-6"
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
        <DialogContent className="max-w-lg rounded-2xl p-6"><DialogHeader><DialogTitle>{selectedCustomer?.id ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>{selectedCustomer && <form onSubmit={(e) => saveCustomer(selectedCustomer, e)} className="space-y-3 py-2"><div><Label>Nome *</Label><Input value={selectedCustomer.nome} onChange={e => setSelectedCustomer({ ...selectedCustomer, nome: e.target.value })} required /></div><div className="grid grid-cols-2 gap-3"><div><Label>Telefone</Label><Input value={selectedCustomer.telefone || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, telefone: e.target.value })} /></div><div><Label>CPF/CNPJ</Label><Input value={selectedCustomer.cpfCnpj || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, cpfCnpj: e.target.value })} /></div></div><div><Label>E-mail</Label><Input type="email" value={selectedCustomer.email || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })} /></div><div><Label>Observações</Label><textarea className="w-full min-h-20 border rounded-md p-2" value={selectedCustomer.observacoes || ""} onChange={e => setSelectedCustomer({ ...selectedCustomer, observacoes: e.target.value })} /></div><Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Salvar cliente</Button></form>}</DialogContent>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg mt-4"
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
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Produtor: <span className="text-emerald-700 font-extrabold">{selectedSupplier?.nome}</span>
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
              <div className="flex justify-between items-center">
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
                    <CardContent className="p-4 flex gap-3 items-end">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Mercadoria</Label>
                          <Input
                            value={prod.nomeMercadoria}
                            onChange={(e) => updateDeliveryProductItem(idx, "nomeMercadoria", e.target.value)}
                            placeholder="Ex: Abobrinha"
                            required
                          />
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
                        className="h-9 w-9"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg mt-6"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg mt-4"
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
