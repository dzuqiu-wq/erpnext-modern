"use client";

import { useEffect } from "react";

interface ProductionParameter {
  label: string;
  value: string;
}

interface MockWorkOrder {
  workOrderNo: string;
  customerName: string;
  salesOrderNo: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  startDate: string;
  endDate: string;
  maker: string;
  auditor: string;
  parameters: ProductionParameter[];
}

// Mock data - 模拟生产单数据
const mockWorkOrder: MockWorkOrder = {
  workOrderNo: "HB26050033",
  customerName: "深圳市某某电子有限公司",
  salesOrderNo: "SO-2026-0042",
  itemCode: "PCB-2026-001",
  itemName: "PCB电路板 V2.0",
  quantity: 1000,
  unit: "PCS",
  startDate: "2026-05-15",
  endDate: "2026-05-25",
  maker: "张三",
  auditor: "李四",
  parameters: [
    { label: "频率", value: "19.95-20.00 MHz" },
    { label: "锣牙", value: "M121.75" },
    { label: "空载电流", value: "≤50mA" },
    { label: "阻抗", value: "50Ω ±5%" },
    { label: "PCB层数", value: "4层" },
    { label: "板厚", value: "1.6mm" },
    { label: "铜厚", value: "1OZ" },
    { label: "表面处理", value: "HASL" },
    { label: "阻焊颜色", value: "绿色" },
    { label: "字符颜色", value: "白色" },
  ],
};

export default function WorkOrderPrintPage() {
  useEffect(() => {
    // Focus on mount for printing
  }, []);

  const wo = mockWorkOrder;

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
      <div className="max-w-[210mm] mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-wide mb-1">惠州市壹品科技有限公司</h1>
          <h2 className="text-xl font-bold tracking-wider">生产单 / WORK ORDER</h2>
        </div>

        {/* Document Info */}
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left w-24">生产单号</th>
              <td className="border border-black p-2 font-mono font-bold">{wo.workOrderNo}</td>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left w-24">销售订单</th>
              <td className="border border-black p-2 font-mono">{wo.salesOrderNo}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">客户名称</th>
              <td className="border border-black p-2">{wo.customerName}</td>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">下单日期</th>
              <td className="border border-black p-2">{wo.startDate}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">成品编码</th>
              <td className="border border-black p-2 font-mono">{wo.itemCode}</td>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">出货日期</th>
              <td className="border border-black p-2">{wo.endDate}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">成品名称</th>
              <td className="border border-black p-2 font-semibold" colSpan={3}>{wo.itemName}</td>
            </tr>
            <tr>
              <th className="border border-black p-2 bg-gray-50 font-medium text-left">生产数量</th>
              <td className="border border-black p-2 font-bold text-lg" colSpan={3}>
                {wo.quantity.toLocaleString()} {wo.unit}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Production Parameters - 3 Columns Layout */}
        <div className="mb-6">
          <h3 className="text-base font-bold border-b border-black pb-1 mb-3">生产工艺参数</h3>
          <table className="w-full border-collapse border border-black">
            <tbody>
              {/* Row 1 */}
              <tr>
                <td className="border border-black p-2 w-1/3">
                  <span className="font-medium">频率：</span>{wo.parameters[0].value}
                </td>
                <td className="border border-black p-2 w-1/3">
                  <span className="font-medium">锣牙：</span>{wo.parameters[1].value}
                </td>
                <td className="border border-black p-2 w-1/3">
                  <span className="font-medium">空载电流：</span>{wo.parameters[2].value}
                </td>
              </tr>
              {/* Row 2 */}
              <tr>
                <td className="border border-black p-2">
                  <span className="font-medium">阻抗：</span>{wo.parameters[3].value}
                </td>
                <td className="border border-black p-2">
                  <span className="font-medium">PCB层数：</span>{wo.parameters[4].value}
                </td>
                <td className="border border-black p-2">
                  <span className="font-medium">板厚：</span>{wo.parameters[5].value}
                </td>
              </tr>
              {/* Row 3 */}
              <tr>
                <td className="border border-black p-2">
                  <span className="font-medium">铜厚：</span>{wo.parameters[6].value}
                </td>
                <td className="border border-black p-2">
                  <span className="font-medium">表面处理：</span>{wo.parameters[7].value}
                </td>
                <td className="border border-black p-2"></td>
              </tr>
              {/* Row 4 */}
              <tr>
                <td className="border border-black p-2">
                  <span className="font-medium">阻焊颜色：</span>{wo.parameters[8].value}
                </td>
                <td className="border border-black p-2">
                  <span className="font-medium">字符颜色：</span>{wo.parameters[9].value}
                </td>
                <td className="border border-black p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quality Requirements */}
        <div className="mb-6">
          <h3 className="text-base font-bold border-b border-black pb-1 mb-3">质量要求</h3>
          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-1/2">
                  <span className="font-medium">外观检验：</span>无明显划痕、污渍、氧化
                </td>
                <td className="border border-black p-2">
                  <span className="font-medium">功能测试：</span>100% ICT测试
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2">
                  <span className="font-medium">包装要求：</span>防静电袋 + 泡沫 + 纸箱
                </td>
                <td className="border border-black p-2">
                  <span className="font-medium">标签要求：</span>每PCS贴序列号标签
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <div className="mt-12">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-2 text-center w-1/3">
                  <div className="border-b border-black pb-1 mb-1">制表人</div>
                  <div className="h-12"></div>
                  <div className="font-mono">{wo.maker}</div>
                </td>
                <td className="p-2 text-center w-1/3">
                  <div className="border-b border-black pb-1 mb-1">审核人</div>
                  <div className="h-12"></div>
                  <div className="font-mono">{wo.auditor}</div>
                </td>
                <td className="p-2 text-center w-1/3">
                  <div className="border-b border-black pb-1 mb-1">批准人</div>
                  <div className="h-12"></div>
                  <div className="font-mono">___________</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>本单据为惠州市壹品科技有限公司内部生产凭证，请妥善保管</p>
          <p className="mt-1">电话: 0752-XXXXXXX | 传真: 0752-XXXXXXX | 地址: 惠州市惠阳区XXXX</p>
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
