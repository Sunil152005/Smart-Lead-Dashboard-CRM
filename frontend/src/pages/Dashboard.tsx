import React, { useEffect, useState, useCallback, useRef } from "react";
import { CSVLink } from "react-csv";
import {
  Search,
  Download,
  Trash2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Command,
} from "lucide-react";
import API from "../api";
import { Navbar } from "../components/Navbar";
import { KPIStats } from "../components/KPIStats";
import { LeadTable } from "../components/LeadTable";
import { KanbanBoard } from "../components/KanbanBoard";
import { AnalyticsView } from "../components/AnalyticsView";
import { LeadDrawer } from "../components/LeadDrawer";
import { LeadModal } from "../components/LeadModal";
import { ImportModal } from "../components/ImportModal";
import { useToast } from "../context/ToastContext";
import type { ILead, LeadStatus, AnalyticsData, LeadFilterOptions } from "../types";

export const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<"table" | "kanban" | "analytics">("table");
  const [leads, setLeads] = useState<ILead[]>([]);
  const [allLeadsForKanban, setAllLeadsForKanban] = useState<ILead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  // User details & Role
  const role = localStorage.getItem("role");
  const [userName, setUserName] = useState<string>("Sales Rep");

  // Filters & Sorting state
  const [filters, setFilters] = useState<LeadFilterOptions>({
    search: "",
    status: "ALL",
    source: "ALL",
    priority: "ALL",
    assignedTo: "ALL",
    category: "ALL",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
  });

  // Debounced search state
  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("ALL");
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Bulk Selected Leads
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals and Drawer state
  const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
  const [editingLead, setEditingLead] = useState<ILead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { showToast } = useToast();

  // Load User profile
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUserName(u.name || (role === "ADMIN" ? "Rahul Sharma" : "Priya Patel"));
      } catch {
        setUserName(role === "ADMIN" ? "Rahul Sharma" : "Priya Patel");
      }
    } else {
      setUserName(role === "ADMIN" ? "Rahul Sharma" : "Priya Patel");
    }
  }, [role]);

  // Debounce search input (350ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchInput) return prev;
        return { ...prev, search: searchInput, page: 1 };
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keyboard Shortcuts (/, N, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' or 'Ctrl+K'
      if (
        (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // 'N' for new lead when not in an input
      if (
        (e.key === "n" || e.key === "N") &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !isCreateModalOpen &&
        !editingLead &&
        !selectedLead
      ) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }

      // 'Esc' to close drawers/modals
      if (e.key === "Escape") {
        if (selectedLead) setSelectedLead(null);
        if (editingLead) setEditingLead(null);
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        if (isImportModalOpen) setIsImportModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen, editingLead, selectedLead, isImportModalOpen]);

  // Fetch Leads (Paginated for Table view)
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.source && filters.source !== "ALL") params.append("source", filters.source);
      if (filters.priority && filters.priority !== "ALL") params.append("priority", filters.priority);
      if (filters.assignedTo && filters.assignedTo !== "ALL") params.append("assignedTo", filters.assignedTo);
      if (filters.category && filters.category !== "ALL") params.append("category", filters.category);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      params.append("page", String(filters.page));
      params.append("limit", "10"); // Mandatory 10 records per page from PDF requirement

      const res = await API.get(`/leads?${params.toString()}`);
      setLeads(res.data.leads || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalLeads(res.data.totalLeads || 0);
    } catch (error: any) {
      console.error("Fetch Leads Error:", error);
      const msg =
        error.code === "ERR_NETWORK" || !error.response
          ? "Cannot connect to backend server. Please verify backend is running on port 5000."
          : error.response?.data?.message || "Failed to load leads from server.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  // Fetch all leads for Kanban board view
  const fetchAllLeadsForKanban = useCallback(async () => {
    try {
      const res = await API.get("/leads?limit=all");
      setAllLeadsForKanban(res.data.leads || []);
    } catch (error) {
      console.error("Fetch Kanban Leads Error:", error);
    }
  }, []);

  // Fetch Analytics Data
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await API.get("/leads/analytics");
      setAnalytics(res.data);
    } catch (error) {
      console.error("Fetch Analytics Error:", error);
    }
  }, []);

  // Initial and reactive data fetching
  useEffect(() => {
    fetchLeads();
    fetchAnalytics();
    if (currentView === "kanban") {
      fetchAllLeadsForKanban();
    }
  }, [fetchLeads, fetchAnalytics, fetchAllLeadsForKanban, currentView]);

  // Quick Filters (Hot Leads, Won Deals, Proposals)
  const applyQuickFilter = (preset: string) => {
    setActiveQuickFilter(preset);
    if (preset === "ALL") {
      setFilters((prev) => ({ ...prev, status: "ALL", category: "ALL", page: 1 }));
    } else if (preset === "HOT") {
      setFilters((prev) => ({ ...prev, category: "Hot", status: "ALL", page: 1 }));
    } else if (preset === "WON") {
      setFilters((prev) => ({ ...prev, status: "Won", category: "ALL", page: 1 }));
    } else if (preset === "QUALIFIED") {
      setFilters((prev) => ({ ...prev, status: "Qualified", category: "ALL", page: 1 }));
    } else if (preset === "PROPOSAL") {
      setFilters((prev) => ({ ...prev, status: "Proposal Sent", category: "ALL", page: 1 }));
    }
  };

  // Create Lead
  const handleCreateLead = async (leadData: Partial<ILead>) => {
    try {
      await API.post("/leads", leadData);
      showToast("New lead created with automated AI score!", "success");
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to create lead", "error");
    }
  };

  // Update Lead
  const handleUpdateLead = async (leadData: Partial<ILead>) => {
    if (!editingLead) return;
    try {
      const res = await API.put(`/leads/${editingLead._id}`, leadData);
      showToast("Lead updated successfully!", "success");
      setEditingLead(null);
      if (selectedLead && selectedLead._id === editingLead._id) {
        setSelectedLead(res.data);
      }
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to update lead", "error");
    }
  };

  // Update Status Stage
  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    try {
      const res = await API.put(`/leads/${id}`, { status: newStatus });
      showToast(`Stage updated to "${newStatus}"!`, "success");
      if (selectedLead && selectedLead._id === id) {
        setSelectedLead(res.data);
      }
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast("Failed to update status", "error");
    }
  };

  // Add Note to Lead Timeline
  const handleAddNote = async (
    id: string,
    content: string,
    type: "note" | "call" | "email"
  ) => {
    try {
      const res = await API.post(`/leads/${id}/notes`, { content, type });
      showToast("Activity note appended to timeline!", "success");
      setSelectedLead(res.data);
      fetchLeads();
      fetchAnalytics();
    } catch (error: any) {
      console.error(error);
      showToast("Failed to add note", "error");
    }
  };

  // Delete Single Lead (Admin Only)
  const handleDeleteLead = async (id: string, name: string) => {
    if (role !== "ADMIN") {
      showToast("Only Admins have permission to delete leads.", "warning");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete lead "${name}"?`)) {
      return;
    }

    try {
      await API.delete(`/leads/${id}`);
      showToast(`Lead "${name}" deleted.`, "success");
      if (selectedLead?._id === id) setSelectedLead(null);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || "Failed to delete lead", "error");
    }
  };

  // Bulk Delete Leads (Admin Only)
  const handleBulkDelete = async () => {
    if (role !== "ADMIN") {
      showToast("Only Admins can delete leads in bulk.", "warning");
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} selected leads?`)) {
      return;
    }

    try {
      await API.post("/leads/bulk-delete", { ids: selectedIds });
      showToast(`${selectedIds.length} leads deleted successfully.`, "success");
      setSelectedIds([]);
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast("Bulk delete failed", "error");
    }
  };

  // Bulk Update Stage
  const handleBulkStatusChange = async (newStatus: LeadStatus) => {
    try {
      await API.post("/leads/bulk-update", {
        ids: selectedIds,
        updates: { status: newStatus },
      });
      showToast(`${selectedIds.length} leads moved to "${newStatus}".`, "success");
      setSelectedIds([]);
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast("Bulk update failed", "error");
    }
  };

  // Import Leads from CSV
  const handleImportLeads = async (importedLeads: Partial<ILead>[]) => {
    try {
      const res = await API.post("/leads/import", { leads: importedLeads });
      showToast(res.data.message || "Leads imported successfully!", "success");
      fetchLeads();
      fetchAnalytics();
      fetchAllLeadsForKanban();
    } catch (error: any) {
      console.error(error);
      showToast("Import failed. Please verify CSV format.", "error");
    }
  };

  // Sorting
  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  // Row Selection Toggle
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  // Quick Switch Role (Admin / Sales)
  const handleQuickSwitchRole = async (targetRole: "ADMIN" | "SALES") => {
    const targetEmail = targetRole === "ADMIN" ? "rahul@gmail.com" : "priya@sales.com";
    try {
      const res = await API.post("/auth/login", {
        email: targetEmail,
        password: "123456",
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      showToast(`Switched account to ${targetRole === "ADMIN" ? "Rahul (Admin)" : "Priya (Sales Rep)"}!`, "info");
      window.location.reload();
    } catch (error: any) {
      const msg =
        error.code === "ERR_NETWORK" || !error.response
          ? "Cannot connect to backend server."
          : error.response?.data?.message || "Failed to switch role.";
      showToast(msg, "error");
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setActiveQuickFilter("ALL");
    setSearchInput("");
    setFilters({
      search: "",
      status: "ALL",
      source: "ALL",
      priority: "ALL",
      assignedTo: "ALL",
      category: "ALL",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    showToast("Signed out successfully.", "info");
    window.location.href = "/";
  };

  const formatCurrency = (val: number = 0) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toLocaleString()}`;
  };

  // CSV Export Preparation
  const csvData = leads.map((l) => ({
    ID: l._id,
    Name: l.name,
    Email: l.email,
    Phone: l.phone || "",
    Company: l.company || "",
    JobTitle: l.jobTitle || "",
    DealValue: l.dealValue || 0,
    Currency: l.currency || "USD",
    Status: l.status,
    Priority: l.priority,
    Source: l.source,
    LeadScore: l.leadScore,
    Category: l.leadScoreCategory,
    AssignedTo: l.assignedTo,
    FollowUpDate: l.followUpDate ? new Date(l.followUpDate).toISOString().split("T")[0] : "",
    CreatedAt: new Date(l.createdAt).toISOString(),
  }));

  const pipelineStages = [
    { key: "New", label: "New", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900" },
    { key: "Contacted", label: "Contacted", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900" },
    { key: "In Progress", label: "In Progress", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" },
    { key: "Qualified", label: "Qualified", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900" },
    { key: "Proposal Sent", label: "Proposal", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" },
    { key: "Won", label: "Won 🏆", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" },
    { key: "Lost", label: "Lost", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navbar with Theme, Role, & View Switchers */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        role={role}
        userName={userName}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onLogout={handleLogout}
        onQuickSwitchRole={handleQuickSwitchRole}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Real-time KPI Stats Cards */}
        <KPIStats analytics={analytics} loading={loading} />

        {/* 2. Pipeline Stages Visual Tracker */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pipeline Stages Breakdown (Click to filter):
              </h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {pipelineStages.map((stage) => {
              const count = analytics?.statusCounts?.[stage.key]?.count || 0;
              const val = analytics?.statusCounts?.[stage.key]?.value || 0;
              const isSelected = filters.status === stage.key;

              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      status: isSelected ? "ALL" : stage.key,
                      page: 1,
                    }))
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-indigo-600 dark:ring-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-sm"
                      : `${stage.bg} hover:shadow-xs`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs font-bold px-1.5 py-0.2 bg-white dark:bg-slate-800 rounded-md text-slate-800 dark:text-slate-200 shadow-2xs">
                      {count}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                    {formatCurrency(val)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Search & Advanced Filtering Control Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* Debounced Search Box with Keyboard Shortcut badge */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search leads by name, email, company, tag..."
                className="w-full pl-10 pr-12 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
              <div className="absolute right-2.5 top-2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <Command className="w-3 h-3" />
                <span>/</span>
              </div>
            </div>

            {/* Quick Filter Buttons & Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
              {/* All Leads */}
              <button
                onClick={() => applyQuickFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeQuickFilter === "ALL" && filters.status === "ALL" && filters.category === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All Leads
              </button>

              {/* Hot Leads */}
              <button
                onClick={() => applyQuickFilter("HOT")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filters.category === "Hot"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Hot Leads 🔥</span>
              </button>

              {/* Proposals Sent */}
              <button
                onClick={() => applyQuickFilter("PROPOSAL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filters.status === "Proposal Sent"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900"
                }`}
              >
                Proposals Sent
              </button>

              {/* Won Deals */}
              <button
                onClick={() => applyQuickFilter("WON")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filters.status === "Won"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900"
                }`}
              >
                Won Deals 🏆
              </button>

              {/* Acquisition Source Dropdown */}
              <select
                value={filters.source}
                onChange={(e) =>
                  setFilters({ ...filters, source: e.target.value, page: 1 })
                }
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sources</option>
                <option value="Website">Website</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Referral">Referral</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Event">Event</option>
              </select>

              {/* Priority Dropdown */}
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value, page: 1 })
                }
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priority</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* CSV Export Button */}
              <CSVLink
                data={csvData}
                filename={`smart_leads_${new Date().toISOString().split("T")[0]}.csv`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </CSVLink>
            </div>
          </div>
        </div>

        {/* 4. Bulk Action Banner (Appears when leads are checked) */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-indigo-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-2 text-xs font-bold pl-2">
              <CheckSquare className="w-4 h-4 text-indigo-300" />
              <span>{selectedIds.length} leads selected for batch action</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-200">Move stage to:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as LeadStatus);
                  }
                }}
                defaultValue=""
                className="bg-indigo-950 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-indigo-700 cursor-pointer"
              >
                <option value="" disabled>
                  Select stage...
                </option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Progress">In Progress</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Won">Closed Won 🏆</option>
                <option value="Lost">Closed Lost</option>
              </select>

              {role === "ADMIN" && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              )}

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 rounded-xl text-xs text-indigo-200 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 5. Main Content Switching Views */}
        {currentView === "table" && (
          <div className="space-y-4">
            <LeadTable
              leads={leads}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onEditLead={(lead) => setEditingLead(lead)}
              onDeleteLead={handleDeleteLead}
              onUpdateStatus={handleUpdateStatus}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSort={handleSort}
              role={role}
            />

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Showing {leads.length} of {totalLeads} records (Page {filters.page} of {totalPages})
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-xs font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  {filters.page}
                </span>
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "kanban" && (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Visual Kanban Pipeline Board
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total Deals: {allLeadsForKanban.length}
              </span>
            </div>
            <KanbanBoard
              leads={allLeadsForKanban}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onUpdateStatus={handleUpdateStatus}
              role={role}
            />
          </div>
        )}

        {currentView === "analytics" && (
          <AnalyticsView
            analytics={analytics}
            leads={allLeadsForKanban.length > 0 ? allLeadsForKanban : leads}
          />
        )}
      </main>

      {/* Slide-over Profile Drawer with Activity Timeline & AI Breakdown */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
        onEdit={(lead) => {
          setSelectedLead(null);
          setEditingLead(lead);
        }}
        role={role}
      />

      {/* Create / Edit Modal */}
      <LeadModal
        isOpen={isCreateModalOpen || !!editingLead}
        initialLead={editingLead}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingLead(null);
        }}
        onSubmit={editingLead ? handleUpdateLead : handleCreateLead}
      />

      {/* CSV Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportLeads}
      />
    </div>
  );
};

export default Dashboard;