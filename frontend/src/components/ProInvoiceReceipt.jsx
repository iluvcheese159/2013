import { BRAND_NAME } from "@/lib/branding";

export default function ProInvoiceReceipt({ invoice }) {
  if (!invoice) return null;

  return (
    <div data-testid="pro-invoice" className="mx-auto w-full max-w-3xl border border-border rounded-xl overflow-hidden text-left">
      <div className="px-6 py-5 border-b border-border bg-secondary/30 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-tech uppercase tracking-[0.25em] text-muted-foreground mb-2">Official Receipt</div>
          <h2 className="font-display text-2xl font-medium tracking-tight">{BRAND_NAME} Hyperspace Invoice</h2>
        </div>
        <div className="text-right text-xs font-tech text-muted-foreground space-y-1">
          <div>Invoice ID: <span className="text-foreground">{invoice.invoice_id}</span></div>
          <div>Transaction ID: <span className="text-foreground">{invoice.transaction_id}</span></div>
          <div>Issued: <span className="text-foreground">{invoice.issued_at ? new Date(invoice.issued_at).toLocaleString() : "-"}</span></div>
        </div>
      </div>

      <div className="px-6 py-5 border-b border-border">
        <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Bill To</div>
        <div className="font-medium">{invoice.buyer_name || "Member"}</div>
        <div className="text-sm text-muted-foreground">{invoice.buyer_email || "-"}</div>
      </div>

      <div className="px-6 py-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-tech uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/70">
              <td className="py-3">{invoice.item}</td>
              <td className="py-3">{invoice.quantity}</td>
              <td className="py-3">${Number(invoice.unit_price || 0).toFixed(2)}</td>
              <td className="py-3 text-right">${Number(invoice.subtotal || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${Number(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>${Number(invoice.tax || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-medium border-t border-border pt-2 mt-2">
            <span>Total ({invoice.currency || "USD"})</span>
            <span>${Number(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 text-xs text-muted-foreground border-t border-border bg-secondary/20">
        This receipt confirms your Print Cosmos Hyperspace membership charge of $4.99 USD. Keep this invoice for your records.
      </div>
    </div>
  );
}
