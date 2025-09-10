import { useState, useRef } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { 
  Download, 
  Printer, 
  Mail, 
  FileText, 
  Building, 
  User, 
  Calendar,
  DollarSign,
  Receipt,
  AlertCircle
} from 'lucide-react'

export function InvoiceGenerator({ 
  invoiceData, 
  onDownload, 
  onPrint, 
  onEmail,
  showActions = true 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const invoiceRef = useRef(null)

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateSubtotal = () => {
    return invoiceData.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return (subtotal * (invoiceData.taxRate || 0)) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const lateFee = invoiceData.lateFee || 0
    const discount = invoiceData.discount || 0
    
    return subtotal + tax + lateFee - discount
  }

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(invoiceData)
    } else {
      // Default PDF generation using html2pdf
      setIsGenerating(true)
      try {
        const html2pdf = await import('html2pdf.js')
        
        const opt = {
          margin: 1,
          filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }

        await html2pdf.default().from(invoiceRef.current).set(opt).save()
      } catch (error) {
        console.error('PDF generation failed:', error)
        alert('Failed to generate PDF. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint(invoiceData)
    } else {
      window.print()
    }
  }

  const handleEmail = () => {
    if (onEmail) {
      onEmail(invoiceData)
    } else {
      // Default email behavior
      const subject = `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.schoolName}`
      const body = `Please find attached invoice ${invoiceData.invoiceNumber} for ${invoiceData.studentName}.`
      
      window.open(`mailto:${invoiceData.studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'partial':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  if (!invoiceData) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No invoice data available</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Invoice Actions */}
      {showActions && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Invoice #{invoiceData.invoiceNumber}</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoiceData.status)}`}>
              {invoiceData.status || 'Draft'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleEmail}
              className="flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Content */}
      <Card className="p-0" ref={invoiceRef}>
        {/* Header */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invoiceData.schoolName || 'School Name'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {invoiceData.schoolAddress || 'School Address'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Phone: {invoiceData.schoolPhone || 'N/A'} | Email: {invoiceData.schoolEmail || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-2">
                INVOICE
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Invoice #:</strong> {invoiceData.invoiceNumber}</p>
                <p><strong>Date:</strong> {formatDate(invoiceData.invoiceDate)}</p>
                <p><strong>Due Date:</strong> {formatDate(invoiceData.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Bill To
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {invoiceData.studentName || 'Student Name'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {invoiceData.studentEmail || 'student@email.com'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Class: {invoiceData.className || 'N/A'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Student ID: {invoiceData.studentId || 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Academic Period
              </h3>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Year:</strong> {invoiceData.academicYear || 'N/A'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Term:</strong> {invoiceData.term || 'N/A'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Session:</strong> {invoiceData.session || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="p-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Fee Breakdown
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 font-medium text-gray-900 dark:text-white">Description</th>
                  <th className="text-right py-3 font-medium text-gray-900 dark:text-white">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-gray-900 dark:text-white">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.details}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount, invoiceData.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-md ml-auto space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium">{formatCurrency(calculateSubtotal(), invoiceData.currency)}</span>
            </div>
            
            {invoiceData.taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Tax ({invoiceData.taxRate}%):
                </span>
                <span className="font-medium">{formatCurrency(calculateTax(), invoiceData.currency)}</span>
              </div>
            )}
            
            {invoiceData.lateFee > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Late Fee:</span>
                <span className="font-medium">{formatCurrency(invoiceData.lateFee, invoiceData.currency)}</span>
              </div>
            )}
            
            {invoiceData.discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount:</span>
                <span className="font-medium">-{formatCurrency(invoiceData.discount, invoiceData.currency)}</span>
              </div>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal(), invoiceData.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="p-8 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Payment Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-blue-800 dark:text-blue-200 mb-2">
                <strong>Payment Methods:</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Online Payment (Credit/Debit Card)</li>
                <li>• Bank Transfer</li>
                <li>• Cash Payment at School Office</li>
              </ul>
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 mb-2">
                <strong>Important Notes:</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Please include invoice number as reference</li>
                <li>• Late payments may incur additional fees</li>
                <li>• Contact finance office for payment plans</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Thank you for choosing {invoiceData.schoolName || 'our school'}</p>
          <p className="mt-1">For questions about this invoice, please contact the finance office</p>
        </div>
      </Card>
    </div>
  )
}













