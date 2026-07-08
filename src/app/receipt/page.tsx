"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ReceiptContent() {
  const searchParams = useSearchParams();

  const trn = searchParams.get("trn") || "—";
  const date = searchParams.get("date") || "—";
  const time = searchParams.get("time") || "—";
  const plate = searchParams.get("plate") || "—";
  const vehicle = searchParams.get("vehicle") || "—";
  const plaza = searchParams.get("plaza") || "—";
  const lane = searchParams.get("lane") || "—";
  const operator = searchParams.get("operator") || "—";
  const baseToll = searchParams.get("base") || "0.000";
  const vat = searchParams.get("vat") || "0.000";
  const fee = searchParams.get("fee") || "0.500";
  const total = searchParams.get("total") || "0.000";
  const status = searchParams.get("status") || "PAID";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0A1F3F] to-[#0D2847] text-white px-5 py-6 text-center">
          <div className="text-3xl font-bold tracking-wider mb-1">TOLL</div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-teal-400 font-medium">Global Toll Management</div>
          <div className="text-[9px] text-gray-400 mt-1">نظام إدارة الطرق السريعة — Oman Toll Roads</div>
        </div>

        {/* PAID stamp bar */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-2 font-bold text-sm tracking-wider">
          ✓ {status}
        </div>

        {/* Receipt info */}
        <div className="px-5 py-4 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
            <span className="text-gray-500">TRN</span>
            <span className="font-mono font-bold text-gray-800">{trn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">التاريخ / Date</span>
            <span className="text-gray-800">{date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الوقت / Time</span>
            <span className="text-gray-800">{time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">رقم اللوحة / Plate</span>
            <span className="font-mono font-bold text-gray-800">{plate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">نوع المركبة / Vehicle</span>
            <span className="text-gray-800">{vehicle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">المحطة / Plaza</span>
            <span className="text-gray-800">{plaza}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الممر / Lane</span>
            <span className="text-gray-800">{lane}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الموظف / Operator</span>
            <span className="text-gray-800">{operator}</span>
          </div>
        </div>

        {/* Fare breakdown */}
        <div className="mx-5 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Base Toll</span>
            <span className="text-gray-800">OMR {baseToll}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">VAT 5%</span>
            <span className="text-gray-800">OMR {vat}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Admin Fee</span>
            <span className="text-gray-800">OMR {fee}</span>
          </div>
          <div className="border-t border-gray-300 pt-1.5 flex justify-between font-bold text-sm">
            <span className="text-gray-700">المبلغ الإجمالي / Total</span>
            <span className="text-gray-900">OMR {total}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 text-center text-[9px] text-gray-400 border-t border-gray-200">
          <div>نظام توصيل للطرق السريعة — Global Toll Management System</div>
          <div className="mt-0.5">هذا الإيصال صادر عن نظام الهيئة الرسمي — Official Receipt</div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading receipt...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}
