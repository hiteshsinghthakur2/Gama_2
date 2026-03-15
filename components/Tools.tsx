import React, { useState } from "react";
import { Invoice, Client, UserBusinessProfile } from "../types";
import * as XLSX from "xlsx";

interface ToolsProps {
  invoices: Invoice[];
  clients: Client[];
  userProfile: UserBusinessProfile;
}

const Tools: React.FC<ToolsProps> = ({ invoices, clients, userProfile }) => {
  const [filterType, setFilterType] = useState<"dateRange" | "month" | "year" | "client" | "status">(
    "dateRange",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleExport = () => {
    let filteredInvoices = invoices;

    if (filterType === "dateRange") {
      if (startDate) {
        filteredInvoices = filteredInvoices.filter(
          (inv) => new Date(inv.date) >= new Date(startDate),
        );
      }
      if (endDate) {
        filteredInvoices = filteredInvoices.filter(
          (inv) => new Date(inv.date) <= new Date(endDate),
        );
      }
    } else if (filterType === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      filteredInvoices = filteredInvoices.filter((inv) => {
        const d = new Date(inv.date);
        return (
          d.getFullYear().toString() === year &&
          (d.getMonth() + 1).toString().padStart(2, "0") === month
        );
      });
    } else if (filterType === "year" && selectedYear) {
      filteredInvoices = filteredInvoices.filter(
        (inv) => new Date(inv.date).getFullYear().toString() === selectedYear,
      );
    } else if (filterType === "client" && selectedClientId) {
      filteredInvoices = filteredInvoices.filter(
        (inv) => inv.clientId === selectedClientId,
      );
    } else if (filterType === "status" && selectedStatus) {
      filteredInvoices = filteredInvoices.filter(
        (inv) => inv.status === selectedStatus,
      );
    }

    // Sort by date
    filteredInvoices.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const data = filteredInvoices.map((invoice, index) => {
      const client = clients.find((c) => c.id === invoice.clientId);
      const invoiceDate = new Date(invoice.date);
      const month = invoiceDate.toLocaleString("default", { month: "long" });
      const formattedDate = invoiceDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      let taxableAmount = 0;
      let totalTax = 0;

      invoice.items.forEach((item) => {
        const amount = item.qty * item.rate;
        taxableAmount += amount;
        totalTax += amount * (item.taxRate / 100);
      });

      // Apply discount
      let discountAmount = 0;
      if (invoice.discountType === "percentage" && invoice.discountValue) {
        discountAmount = taxableAmount * (invoice.discountValue / 100);
      } else if (invoice.discountType === "fixed" && invoice.discountValue) {
        discountAmount = invoice.discountValue;
      }

      taxableAmount -= discountAmount;

      // Apply additional charges
      let additionalChargesTotal = 0;
      if (invoice.additionalCharges) {
        additionalChargesTotal = invoice.additionalCharges.reduce(
          (sum, charge) => sum + charge.amount,
          0,
        );
      }

      taxableAmount += additionalChargesTotal;

      // Recalculate tax on new taxable amount (simplified, assuming uniform tax rate for simplicity or proportional)
      // For accurate tax, we should calculate tax per item after discount, but for this export we'll use the ratio
      const originalTaxable =
        taxableAmount + discountAmount - additionalChargesTotal;
      const effectiveTax =
        originalTaxable > 0 ? totalTax * (taxableAmount / originalTaxable) : 0;

      let isIGST = false;
      if (invoice.taxType === 'igst') {
        isIGST = true;
      } else if (invoice.taxType === 'cgst_sgst') {
        isIGST = false;
      } else {
        const supplyStateMatch = invoice.placeOfSupply.match(/\((\d+)\)/);
        const supplyStateCode = supplyStateMatch ? supplyStateMatch[1] : null;
        const userStateCode = userProfile.address.stateCode;

        if (supplyStateCode && userStateCode) {
            isIGST = parseInt(supplyStateCode, 10) !== parseInt(userStateCode, 10);
        } else {
            const posLower = invoice.placeOfSupply.toLowerCase().trim();
            const userStateLower = userProfile.address.state.toLowerCase().trim();
            if (posLower && userStateLower) {
                isIGST = !posLower.includes(userStateLower);
            }
        }
      }

      const igst = isIGST ? effectiveTax : 0;
      const cgst = !isIGST ? effectiveTax / 2 : 0;
      const sgst = !isIGST ? effectiveTax / 2 : 0;

      const total = taxableAmount + effectiveTax + (invoice.roundOff || 0);

      const hsnCodes = [
        ...new Set(invoice.items.map((item) => item.hsn).filter(Boolean)),
      ].join(", ");

      return {
        "S.no.": index + 1,
        Month: month,
        "Invoice Date": formattedDate,
        "Invoice no.": invoice.number,
        "GSTIN of the Deductee": client?.gstin || "NA",
        "Trade Name(Billed to)": client?.name || "Unknown",
        "Taxable Amount": Math.round(taxableAmount * 100) / 100,
        IGST: Math.round(igst * 100) / 100,
        CGST: Math.round(cgst * 100) / 100,
        SGST: Math.round(sgst * 100) / 100,
        Total: Math.round(total),
        "HSN Code": hsnCodes,
      };
    });

    // Add total row
    if (data.length > 0) {
      const totals = data.reduce(
        (acc, row) => {
          acc["Taxable Amount"] += row["Taxable Amount"] as number;
          acc["IGST"] += row["IGST"] as number;
          acc["CGST"] += row["CGST"] as number;
          acc["SGST"] += row["SGST"] as number;
          acc["Total"] += row["Total"] as number;
          return acc;
        },
        {
          "S.no.": "Total",
          Month: "",
          "Invoice Date": "",
          "Invoice no.": "",
          "GSTIN of the Deductee": "",
          "Trade Name(Billed to)": "",
          "Taxable Amount": 0,
          IGST: 0,
          CGST: 0,
          SGST: 0,
          Total: 0,
          "HSN Code": "",
        },
      );

      // Round totals
      totals["Taxable Amount"] =
        Math.round(totals["Taxable Amount"] * 100) / 100;
      totals["IGST"] = Math.round(totals["IGST"] * 100) / 100;
      totals["CGST"] = Math.round(totals["CGST"] * 100) / 100;
      totals["SGST"] = Math.round(totals["SGST"] * 100) / 100;
      totals["Total"] = Math.round(totals["Total"]);

      data.push(totals as any);
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoices_Export_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Tools</h1>
        <p className="text-xs md:text-sm text-gray-500">
          Utility tools for your business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Invoice Export Tool */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Invoice Export</h3>
              <p className="text-xs text-gray-500">Export invoices to Excel</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Filter By
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="dateRange">Date Range</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="client">By Client</option>
                <option value="status">By Status</option>
              </select>
            </div>

            {filterType === "client" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Client
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType === "status" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">Choose a status...</option>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            )}

            {filterType === "dateRange" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            {filterType === "month" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {filterType === "year" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - i,
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Generate Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tools;
