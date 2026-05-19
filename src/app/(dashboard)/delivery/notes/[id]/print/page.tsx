"use client";

import { useEffect } from "react";

interface DeliveryItem {
  serial: number;
  itemCode: string;
  itemName: string;
  specifications: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

interface MockDeliveryNote {
  deliveryNo: string;
  deliveryDate: string;
  salesOrderNo: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  maker: string;
  checker: string;
  notes: string;
  items: DeliveryItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

// Mock data - 模拟送货单数据
const mockDeliveryNote: MockDeliveryNote = {
  deliveryNo: "HB2026050019",
  deliveryDate: "2026-05-20",
  salesOrderNo: "SO-2026-0042",
  customerName: "深圳市某某电子有限公司",
  customerAddress: "深圳市南山区科技园南区XX路XX号",
  customerPhone: "0755-XXXXXXXX",
  maker: "王五",
  checker: "赵六",
  notes: "请收到货后及时清点，如有质量问题请在7天内反馈",
  items: [
    {
      serial: 1,
      itemCode: "PCB-2026-001",
      itemName: "PCB电路板 V2.0",
      specifications: "4层 1.6mm HASL",
      unit: "PCS",
      quantity: 1000,
      unitPrice: 15.50,
      amount: 15500.00,
      taxRate: 13,
      taxAmount: 2015.00,
    },
    {
      serial: 2,
      itemCode: "CAP-2026-001",
      itemName: "贴片电容 100nF",
      specifications: "0805 50V ±10%",
      unit: "PCS",
      quantity: 5000,
      unitPrice: 0.08,
      amount: 400.00,
      taxRate: 13,
      taxAmount: 52.00,
    },
    {
      serial: 3,
      itemCode: "RES-2026-001",
      itemName: "贴片电阻 10K",
      specifications: "0805 1/8W ±1%",
      unit: "PCS",
      quantity: 5000,
      unitPrice: 0.05,
      amount: 250.00,
      taxRate: 13,
      taxAmount: 32.50,
    },
    {
      serial: 4,
      itemCode: "IC-2026-001",
      itemName: "STM32F103C8T6",
      specifications: "LQFP-48",
      unit: "PCS",
      quantity: 200,
      unitPrice: 18.00,
      amount: 3600.00,
      taxRate: 13,
      taxAmount: 468.00,
    },
  ],
  subtotal: 19750.00,
  taxAmount: 2567.50,
  totalAmount: 22317.50,
};

export default function DeliveryNotePrintPage() {
  useEffect(() => {
    // Focus on mount for printing
  }, []);

  const dn = mockDeliveryNote;

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-8 right-8 print:hidden px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg flex items-center gap-2 transition-colors z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        打印单据
      </button>

      {/* A4 Print Content */}
      <div className="max-w-[210mm] mx-auto p-6 print:p-0">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold tracking-wide mb-1">惠州市壹品科技有限公司</h1>
          <h2 className="text-xl font-bold tracking-wider">送货单 / DELIVERY NOTE</h2>
        </div>

        {/* Document Header Info */}
        <table className="w-full border-collapse border border-black mb-3 text-sm">
          <tbody>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left w-20">送货单号</th>
              <td className="border border-black p-2 font-mono font-bold">{dn.deliveryNo}</td>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left w-20">送货日期</th>
              <td className="border border-black p-2">{dn.deliveryDate}</td>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left w-20">销售订单</th>
              <td className="border border-black p-2 font-mono">{dn.salesOrderNo}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">客户名称</th>
              <td className="border border-black p-2 font-semibold" colSpan={5}>{dn.customerName}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">收货地址</th>
              <td className="border border-black p-2" colSpan={5}>{dn.customerAddress}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">联系电话</th>
              <td className="border border-black p-2" colSpan={5}>{dn.customerPhone}</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table className="w-full border-collapse border border-black mb-3 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 font-medium w-10">序号</th>
              <th className="border border-black p-2 font-medium w-24">物料编号</th>
              <th className="border border-black p-2 font-medium w-40">品名/规格</th>
              <th className="border border-black p-2 font-medium w-12">单位</th>
              <th className="border border-black p-2 font-medium w-16">数量</th>
              <th className="border border-black p-2 font-medium w-20">单价(元)</th>
              <th className="border border-black p-2 font-medium w-24">金额(元)</th>
              <th className="border border-black p-2 font-medium w-16">税率(%)</th>
              <th className="border border-black p-2 font-medium w-24">税额(元)</th>
            </tr>
          </thead>
          <tbody>
            {dn.items.map((item) => (
              <tr key={item.serial}>
                <td className="border border-black p-2 text-center">{item.serial}</td>
                <td className="border border-black p-2 font-mono text-xs">{item.itemCode}</td>
                <td className="border border-black p-2">
                  <div className="font-medium">{item.itemName}</div>
                  <div className="text-xs text-gray-600">{item.specifications}</div>
                </td>
                <td className="border border-black p-2 text-center">{item.unit}</td>
                <td className="border border-black p-2 text-right font-mono">{item.quantity.toLocaleString()}</td>
                <td className="border border-black p-2 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                <td className="border border-black p-2 text-right font-mono">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="border border-black p-2 text-center">{item.taxRate}</td>
                <td className="border border-black p-2 text-right font-mono">{item.taxAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-black p-2 text-right" colSpan={6}>合计</td>
              <td className="border border-black p-2 text-right font-mono">{dn.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2 text-right font-mono">{dn.taxAmount.toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-100 font-bold text-lg">
              <td className="border border-black p-2 text-right" colSpan={6}>价税合计（大写）</td>
              <td className="border border-black p-2 text-right font-mono" colSpan={3}>
                ¥{dn.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        <table className="w-full border-collapse border border-black mb-4 text-sm">
          <tbody>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left w-20">备注说明</th>
              <td className="border border-black p-2" colSpan={5}>{dn.notes}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature Section - 5 Signatures */}
        <div className="mb-6">
          <h3 className="text-sm font-bold border-b border-black pb-1 mb-3">签收栏（5联）</h3>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 font-medium">送货单位<br/>(签章)</th>
                <th className="border border-black p-2 font-medium">收货单位<br/>(签章)</th>
                <th className="border border-black p-2 font-medium">仓库验收<br/>(签章)</th>
                <th className="border border-black p-2 font-medium">品质检验<br/>(签章)</th>
                <th className="border border-black p-2 font-medium">财务审核<br/>(签章)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 h-20"></td>
                <td className="border border-black p-2 h-20"></td>
                <td className="border border-black p-2 h-20"></td>
                <td className="border border-black p-2 h-20"></td>
                <td className="border border-black p-2 h-20"></td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center">日期: ____年__月__日</td>
                <td className="border border-black p-2 text-center">日期: ____年__月__日</td>
                <td className="border border-black p-2 text-center">日期: ____年__月__日</td>
                <td className="border border-black p-2 text-center">日期: ____年__月__日</td>
                <td className="border border-black p-2 text-center">日期: ____年__月__日</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Warm Notice - 温馨提示 */}
        <div className="border border-gray-300 bg-gray-50 p-4 mb-4 text-xs">
          <h4 className="font-bold mb-2">💡 温馨提示</h4>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            <li>收到产品后请在 <strong>7天内</strong> 进行清点和验收，如有问题请及时与我司联系。</li>
            <li>未经我司书面确认，擅自退货或折让将不予受理。</li>
            <li>因产品本身质量问题需要退换货时，请保持产品原包装完整，不影响二次销售。</li>
            <li>如对产品质量有异议，可申请第三方检测，检测费用由责任方承担。</li>
            <li>本单据作为买卖双方货物交接的凭证，请妥善保管，以便后续对账结算。</li>
          </ol>
        </div>

        {/* Signature Row */}
        <table className="w-full border-collapse mb-4 text-sm">
          <tbody>
            <tr>
              <td className="p-2 text-center w-1/3">
                <div className="border-b border-black pb-1 mb-1">制单人</div>
                <div className="h-10"></div>
                <div className="font-mono">{dn.maker}</div>
              </td>
              <td className="p-2 text-center w-1/3">
                <div className="border-b border-black pb-1 mb-1">复核人</div>
                <div className="h-10"></div>
                <div className="font-mono">{dn.checker}</div>
              </td>
              <td className="p-2 text-center w-1/3">
                <div className="border-b border-black pb-1 mb-1">联系电话</div>
                <div className="h-10"></div>
                <div className="font-mono">17520233222</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>本单据为惠州市壹品科技有限公司正式发货凭证，具有法律效力</p>
          <p className="mt-1">电话: 0752-XXXXXXX | 传真: 0752-XXXXXXX | 网址: www.hzyipin.com</p>
          <p className="mt-1 font-semibold">地址: 惠州市惠阳区XXXX镇XXXX工业园</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
