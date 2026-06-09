<template>
  <!-- Yazdırma butonu — normal görünümde -->
  <button @click="printBill" class="print-btn" :title="'Adisyon Yazdır'">
    🖨️ Adisyon
  </button>
</template>

<script>
export default {
  name: 'PrintBill',
  props: {
    order: {
      type: Object,
      required: true
    },
    cafeName: {
      type: String,
      default: 'Kafe Sipariş'
    },
    cafeAddress: {
      type: String,
      default: ''
    },
    cafePhone: {
      type: String,
      default: ''
    }
  },
  methods: {
    printBill() {
      const order = this.order
      const items = order.items || []
      const total = order.total || 0
      const now = new Date()
      const dateStr = now.toLocaleDateString('tr-TR')
      const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

      // Ürün satırlarını oluştur
      const itemRows = items.map(item => {
        const lineTotal = (item.price * item.quantity).toFixed(2)
        const name = item.name || 'Ürün'
        const qty = item.quantity || 1
        const price = (item.price || 0).toFixed(2)
        return `
          <tr>
            <td>${name}</td>
            <td style="text-align:center">${qty}</td>
            <td style="text-align:right">${price} ₺</td>
            <td style="text-align:right"><strong>${lineTotal} ₺</strong></td>
          </tr>
          ${item.notes ? `<tr><td colspan="4" style="font-size:11px;color:#666;padding-left:8px">📝 ${item.notes}</td></tr>` : ''}
        `
      }).join('')

      // Adisyon HTML'i
      const billHTML = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>Adisyon - Masa ${order.tableNumber || order.tableId || '?'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 13px;
              color: #000;
              background: #fff;
              padding: 10px;
              max-width: 300px;
              margin: 0 auto;
            }

            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .cafe-name {
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 1px;
            }

            .cafe-info {
              font-size: 11px;
              color: #444;
              margin-top: 4px;
            }

            .bill-title {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin: 8px 0;
              letter-spacing: 2px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 12px;
            }

            .divider {
              border: none;
              border-top: 1px dashed #000;
              margin: 8px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }

            th {
              font-size: 11px;
              border-bottom: 1px solid #000;
              padding: 4px 2px;
              text-align: left;
            }

            td {
              font-size: 12px;
              padding: 4px 2px;
              vertical-align: top;
            }

            .total-section {
              border-top: 2px solid #000;
              margin-top: 8px;
              padding-top: 8px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 13px;
            }

            .grand-total {
              font-size: 16px;
              font-weight: bold;
              border-top: 1px dashed #000;
              border-bottom: 2px solid #000;
              padding: 6px 0;
              margin-top: 4px;
            }

            .footer {
              text-align: center;
              margin-top: 12px;
              font-size: 11px;
              color: #555;
              border-top: 1px dashed #000;
              padding-top: 8px;
            }

            .receipt-no {
              font-size: 10px;
              color: #888;
              text-align: center;
              margin-top: 6px;
            }

            @media print {
              body { padding: 0; }
              @page { margin: 5mm; }
            }
          </style>
        </head>
        <body>

          <!-- Başlık -->
          <div class="header">
            <div class="cafe-name">☕ ${this.cafeName}</div>
            ${this.cafeAddress ? `<div class="cafe-info">${this.cafeAddress}</div>` : ''}
            ${this.cafePhone ? `<div class="cafe-info">Tel: ${this.cafePhone}</div>` : ''}
          </div>

          <div class="bill-title">— ADİSYON —</div>

          <!-- Sipariş Bilgileri -->
          <div class="info-row">
            <span>Masa:</span>
            <strong>Masa ${order.tableNumber || order.tableId || '?'}</strong>
          </div>
          <div class="info-row">
            <span>Sipariş No:</span>
            <span>${order.id || '-'}</span>
          </div>
          <div class="info-row">
            <span>Tarih:</span>
            <span>${dateStr}</span>
          </div>
          <div class="info-row">
            <span>Saat:</span>
            <span>${timeStr}</span>
          </div>
          ${order.waiter ? `<div class="info-row"><span>Garson:</span><span>${order.waiter}</span></div>` : ''}

          <hr class="divider">

          <!-- Ürünler -->
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th style="text-align:center">Adet</th>
                <th style="text-align:right">Fiyat</th>
                <th style="text-align:right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Toplam -->
          <div class="total-section">
            <div class="total-row grand-total">
              <span>TOPLAM</span>
              <span>${parseFloat(total).toFixed(2)} ₺</span>
            </div>
          </div>

          ${order.notes ? `
          <hr class="divider">
          <div style="font-size:11px">
            <strong>Not:</strong> ${order.notes}
          </div>` : ''}

          <!-- Alt Bilgi -->
          <div class="footer">
            <div>Teşekkür ederiz! 🙏</div>
            <div>İyi günler dileriz</div>
          </div>

          <div class="receipt-no">
            Fiş No: ${Date.now().toString().slice(-8)}
          </div>

        </body>
        </html>
      `

      // Yeni pencere aç ve yazdır
      const printWindow = window.open('', '_blank', 'width=400,height=600')
      printWindow.document.write(billHTML)
      printWindow.document.close()

      // Sayfa yüklenince otomatik yazdır
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        // Yazdırma diyaloğu kapanınca pencereyi kapat
        printWindow.onafterprint = () => printWindow.close()
      }
    }
  }
}
</script>

<style scoped>
.print-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.print-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #3730a3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.print-btn:active {
  transform: translateY(0);
}
</style>
