import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Order } from "@/lib/orders";
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from "@/lib/business";
import { formatPEN } from "@/lib/money";
import { PAYMENT_LABELS } from "@/lib/catalog";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#211D19",
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 6.5,
    marginTop: 4,
    color: "#7A6E5E",
    letterSpacing: 1.2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#DDD2C2",
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: {
    fontWeight: "bold",
  },
  itemDetail: {
    marginTop: 1,
    color: "#7A6E5E",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
    color: "#7A6E5E",
    fontSize: 7,
  },
  paid: {
    marginTop: 10,
    alignItems: "center",
    color: "#4C7B64",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});

function formatMetaDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReceiptDocument({ order }: { order: Order }) {
  return (
    <Document title={`Recibo ${order.id}`}>
      <Page size="A7" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{BUSINESS_NAME}</Text>
          <Text style={styles.tagline}>{BUSINESS_SUBTITLE.toUpperCase()}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text>Fecha</Text>
          <Text>{formatMetaDate(order.closed_at ?? order.opened_at)}</Text>
        </View>
        {order.table_label ? (
          <View style={styles.metaRow}>
            <Text>Mesa</Text>
            <Text>{order.table_label}</Text>
          </View>
        ) : null}
        {order.opened_by_name ? (
          <View style={styles.metaRow}>
            <Text>Atendido por</Text>
            <Text>{order.opened_by_name}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>
                {item.quantity} × {formatPEN(item.unit_price)}
                {item.notes ? ` · ${item.notes}` : ""}
              </Text>
            </View>
            <Text>
              {formatPEN(item.quantity * item.unit_price)}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPEN(order.total)}</Text>
        </View>

        {order.payment_method ? (
          <View style={styles.metaRow}>
            <Text>Método de pago</Text>
            <Text>{PAYMENT_LABELS[order.payment_method]}</Text>
          </View>
        ) : null}

        <Text style={styles.paid}>Pagado</Text>

        <View style={styles.footer}>
          <Text>¡Gracias por su visita!</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(order: Order): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument order={order} />);
}