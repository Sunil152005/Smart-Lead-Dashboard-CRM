"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.importLeads = exports.bulkUpdateLeads = exports.bulkDeleteLeads = exports.addNote = exports.deleteLead = exports.updateLead = exports.createLead = exports.getLeadById = exports.getLeads = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Lead_1 = __importDefault(require("../models/Lead"));
const db_1 = require("../services/db");
const leadScorer_1 = require("../services/leadScorer");
// Normalization Helpers to prevent Mongoose enum validation errors
const normalizeStatus = (status) => {
    if (!status)
        return "New";
    const s = String(status).trim().toLowerCase();
    if (s.includes("won"))
        return "Won";
    if (s.includes("lost"))
        return "Lost";
    if (s.includes("prop"))
        return "Proposal Sent";
    if (s.includes("qual"))
        return "Qualified";
    if (s.includes("prog"))
        return "In Progress";
    if (s.includes("contact"))
        return "Contacted";
    return "New";
};
const normalizePriority = (priority) => {
    if (!priority)
        return "Medium";
    const p = String(priority).trim().toLowerCase();
    if (p.includes("urg"))
        return "Urgent";
    if (p.includes("high"))
        return "High";
    if (p.includes("low"))
        return "Low";
    return "Medium";
};
const normalizeSource = (source) => {
    if (!source)
        return "Website";
    const src = String(source).trim().toLowerCase();
    if (src.includes("link"))
        return "LinkedIn";
    if (src.includes("insta"))
        return "Instagram";
    if (src.includes("google") || src.includes("ad"))
        return "Google Ads";
    if (src.includes("ref"))
        return "Referral";
    if (src.includes("cold") || src.includes("outreach"))
        return "Cold Outreach";
    if (src.includes("event"))
        return "Event";
    if (src.includes("web") || src.includes("site"))
        return "Website";
    return "Other";
};
// GET /api/leads - View Leads List with Advanced Filtering, Search & Backend Pagination
const getLeads = async (req, res) => {
    try {
        const { search, status, source, priority, assignedTo, category, sortBy = "createdAt", sortOrder = "desc", page = 1, limit = 10, } = req.query;
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = limit === "all" ? 1000 : Math.max(1, Number(limit) || 10);
        const skip = (pageNum - 1) * limitNum;
        // Normalize sort field: handles 'latest' and 'oldest' aliases
        let actualSortBy = String(sortBy);
        let actualSortOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
        if (actualSortBy === "latest") {
            actualSortBy = "createdAt";
            actualSortOrder = "desc";
        }
        else if (actualSortBy === "oldest") {
            actualSortBy = "createdAt";
            actualSortOrder = "asc";
        }
        if (db_1.isMongoConnected) {
            try {
                const query = {};
                if (status && status !== "ALL") {
                    query.status = status;
                }
                if (source && source !== "ALL") {
                    query.source = source;
                }
                if (priority && priority !== "ALL") {
                    query.priority = priority;
                }
                if (assignedTo && assignedTo !== "ALL") {
                    query.assignedTo = assignedTo;
                }
                if (category && category !== "ALL") {
                    query.leadScoreCategory = category;
                }
                if (search) {
                    const searchStr = String(search).trim();
                    query.$or = [
                        { name: { $regex: searchStr, $options: "i" } },
                        { email: { $regex: searchStr, $options: "i" } },
                        { company: { $regex: searchStr, $options: "i" } },
                        { phone: { $regex: searchStr, $options: "i" } },
                        { tags: { $in: [new RegExp(searchStr, "i")] } },
                    ];
                }
                const sortDirection = actualSortOrder === "asc" ? 1 : -1;
                const sortObj = { [actualSortBy]: sortDirection };
                const [leads, total] = await Promise.all([
                    Lead_1.default.find(query).sort(sortObj).skip(skip).limit(limitNum),
                    Lead_1.default.countDocuments(query),
                ]);
                const totalPages = Math.ceil(total / limitNum) || 1;
                return res.json({
                    success: true,
                    leads,
                    totalLeads: total,
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                });
            }
            catch (mongoErr) {
                console.warn("MongoDB getLeads query error, falling back to local memory store:", mongoErr.message);
            }
        }
        // Memory Store Querying with In-Memory Search, Filter & Pagination
        let filtered = [...db_1.memoryStore.leads];
        if (status && status !== "ALL") {
            filtered = filtered.filter((l) => l.status === status);
        }
        if (source && source !== "ALL") {
            filtered = filtered.filter((l) => l.source === source);
        }
        if (priority && priority !== "ALL") {
            filtered = filtered.filter((l) => l.priority === priority);
        }
        if (assignedTo && assignedTo !== "ALL") {
            filtered = filtered.filter((l) => l.assignedTo === assignedTo);
        }
        if (category && category !== "ALL") {
            filtered = filtered.filter((l) => l.leadScoreCategory === category);
        }
        if (search) {
            const q = String(search).toLowerCase().trim();
            filtered = filtered.filter((l) => {
                const matchName = l.name?.toLowerCase().includes(q);
                const matchEmail = l.email?.toLowerCase().includes(q);
                const matchCompany = l.company?.toLowerCase().includes(q);
                const matchPhone = l.phone?.toLowerCase().includes(q);
                const matchTags = Array.isArray(l.tags) && l.tags.some((t) => t.toLowerCase().includes(q));
                return matchName || matchEmail || matchCompany || matchPhone || matchTags;
            });
        }
        // In-Memory Sorting
        const isAsc = actualSortOrder === "asc";
        filtered.sort((a, b) => {
            let valA = a[actualSortBy];
            let valB = b[actualSortBy];
            if (actualSortBy === "createdAt" || actualSortBy === "updatedAt") {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }
            else if (typeof valA === "number" && typeof valB === "number") {
                return isAsc ? valA - valB : valB - valA;
            }
            else if (typeof valA === "string") {
                valA = valA.toLowerCase();
                valB = (valB || "").toLowerCase();
            }
            if (valA < valB)
                return isAsc ? -1 : 1;
            if (valA > valB)
                return isAsc ? 1 : -1;
            return 0;
        });
        const total = filtered.length;
        const totalPages = Math.ceil(total / limitNum) || 1;
        const paginatedLeads = filtered.slice(skip, skip + limitNum);
        return res.json({
            success: true,
            leads: paginatedLeads,
            totalLeads: total,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
        });
    }
    catch (error) {
        console.error("Get Leads Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch leads", error: error.message });
    }
};
exports.getLeads = getLeads;
// GET /api/leads/:id - View Single Lead Details
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        let lead = null;
        if (db_1.isMongoConnected && mongoose_1.default.isValidObjectId(id)) {
            try {
                lead = await Lead_1.default.findById(id);
            }
            catch (err) {
                console.warn("MongoDB getLeadById error:", err.message);
            }
        }
        if (!lead) {
            lead = db_1.memoryStore.leads.find((l) => String(l._id) === String(id));
        }
        if (!lead) {
            return res.status(404).json({ success: false, message: `Lead not found with ID: ${id}` });
        }
        return res.json({ success: true, lead });
    }
    catch (error) {
        console.error("Get Lead By ID Error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve lead details", error: error.message });
    }
};
exports.getLeadById = getLeadById;
// POST /api/leads - Create Lead
const createLead = async (req, res) => {
    try {
        const data = req.body;
        if (!data.name || !data.email) {
            return res.status(400).json({ success: false, message: "Lead name and email are mandatory." });
        }
        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address." });
        }
        const scoring = (0, leadScorer_1.calculateLeadScore)(data);
        const initialNotes = Array.isArray(data.notes) ? [...data.notes] : [];
        const creatorName = req.user?.name || "Rahul Sharma";
        initialNotes.push({
            author: creatorName,
            content: `Lead created in CRM via ${data.source || "Website"}.`,
            type: "note",
            createdAt: new Date(),
        });
        const leadPayload = {
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            phone: data.phone || "",
            company: data.company || "Individual",
            jobTitle: data.jobTitle || "Lead Contact",
            dealValue: Number(data.dealValue || 0),
            currency: data.currency || "USD",
            status: normalizeStatus(data.status),
            priority: normalizePriority(data.priority),
            source: normalizeSource(data.source),
            assignedTo: data.assignedTo || creatorName,
            leadScore: scoring.score,
            leadScoreCategory: scoring.category,
            scoreFactors: scoring.factors,
            followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            notes: initialNotes,
        };
        let createdLead = null;
        if (db_1.isMongoConnected) {
            try {
                createdLead = await Lead_1.default.create(leadPayload);
            }
            catch (err) {
                console.warn("MongoDB createLead error, falling back to local store:", err.message);
            }
        }
        if (!createdLead) {
            createdLead = {
                _id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                ...leadPayload,
                notes: initialNotes.map((n, i) => ({
                    _id: `note_${Date.now()}_${i}`,
                    ...n,
                })),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            db_1.memoryStore.leads.unshift(createdLead);
        }
        else {
            db_1.memoryStore.leads.unshift({
                _id: String(createdLead._id),
                ...leadPayload,
                createdAt: createdLead.createdAt,
                updatedAt: createdLead.updatedAt,
            });
        }
        return res.status(201).json(createdLead);
    }
    catch (error) {
        console.error("Create Lead Error:", error);
        return res.status(500).json({ success: false, message: "Failed to create lead", error: error.message });
    }
};
exports.createLead = createLead;
// PUT /api/leads/:id - Update Lead
const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.status)
            updates.status = normalizeStatus(updates.status);
        if (updates.priority)
            updates.priority = normalizePriority(updates.priority);
        if (updates.source)
            updates.source = normalizeSource(updates.source);
        let existingLead = null;
        if (db_1.isMongoConnected && mongoose_1.default.isValidObjectId(id)) {
            try {
                existingLead = await Lead_1.default.findById(id);
            }
            catch (err) {
                console.warn("MongoDB findById for update error:", err.message);
            }
        }
        if (!existingLead) {
            existingLead = db_1.memoryStore.leads.find((l) => String(l._id) === String(id));
        }
        if (!existingLead) {
            return res.status(404).json({ success: false, message: "Lead not found." });
        }
        // Check if status changed to log activity timeline event
        const notes = existingLead.notes ? [...existingLead.notes] : [];
        if (updates.status && updates.status !== existingLead.status) {
            const updater = req.user?.name || "Team Member";
            notes.push({
                _id: `note_${Date.now()}`,
                author: updater,
                content: `Stage updated from "${existingLead.status}" to "${updates.status}".`,
                type: "stage_change",
                createdAt: new Date(),
            });
            updates.notes = notes;
        }
        // Recalculate score with updated fields
        const mergedForScore = {
            ...(existingLead.toObject ? existingLead.toObject() : existingLead),
            ...updates,
        };
        const scoring = (0, leadScorer_1.calculateLeadScore)(mergedForScore);
        updates.leadScore = scoring.score;
        updates.leadScoreCategory = scoring.category;
        updates.scoreFactors = scoring.factors;
        updates.updatedAt = new Date();
        let updatedResult = null;
        if (db_1.isMongoConnected && mongoose_1.default.isValidObjectId(id)) {
            try {
                updatedResult = await Lead_1.default.findByIdAndUpdate(id, updates, { new: true });
            }
            catch (err) {
                console.warn("MongoDB findByIdAndUpdate error:", err.message);
            }
        }
        // Always update memoryStore as well
        const idx = db_1.memoryStore.leads.findIndex((l) => String(l._id) === String(id));
        if (idx !== -1) {
            db_1.memoryStore.leads[idx] = {
                ...db_1.memoryStore.leads[idx],
                ...updates,
            };
            if (!updatedResult)
                updatedResult = db_1.memoryStore.leads[idx];
        }
        if (!updatedResult) {
            return res.status(404).json({ success: false, message: "Lead not found." });
        }
        return res.json(updatedResult);
    }
    catch (error) {
        console.error("Update Lead Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update lead", error: error.message });
    }
};
exports.updateLead = updateLead;
// DELETE /api/leads/:id - Delete Lead (Admin Only)
const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        let deleted = false;
        if (db_1.isMongoConnected && mongoose_1.default.isValidObjectId(id)) {
            try {
                const result = await Lead_1.default.findByIdAndDelete(id);
                if (result)
                    deleted = true;
            }
            catch (err) {
                console.warn("MongoDB delete error:", err.message);
            }
        }
        const idx = db_1.memoryStore.leads.findIndex((l) => String(l._id) === String(id));
        if (idx !== -1) {
            db_1.memoryStore.leads.splice(idx, 1);
            deleted = true;
        }
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Lead not found." });
        }
        return res.json({ success: true, message: "Lead deleted successfully", id });
    }
    catch (error) {
        console.error("Delete Lead Error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete lead", error: error.message });
    }
};
exports.deleteLead = deleteLead;
// POST /api/leads/:id/notes - Add Note / Timeline Event
const addNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type = "note" } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: "Note content is required." });
        }
        const author = req.user?.name || "Rahul Sharma";
        const newNote = {
            author,
            content,
            type: type,
            createdAt: new Date(),
        };
        let updatedLead = null;
        if (db_1.isMongoConnected && mongoose_1.default.isValidObjectId(id)) {
            try {
                const lead = await Lead_1.default.findById(id);
                if (lead) {
                    lead.notes.push(newNote);
                    const scoring = (0, leadScorer_1.calculateLeadScore)(lead);
                    lead.leadScore = scoring.score;
                    lead.leadScoreCategory = scoring.category;
                    lead.scoreFactors = scoring.factors;
                    await lead.save();
                    updatedLead = lead;
                }
            }
            catch (err) {
                console.warn("MongoDB addNote error:", err.message);
            }
        }
        const idx = db_1.memoryStore.leads.findIndex((l) => String(l._id) === String(id));
        if (idx !== -1) {
            const lead = db_1.memoryStore.leads[idx];
            const noteItem = { _id: `note_${Date.now()}`, ...newNote };
            lead.notes = [...(lead.notes || []), noteItem];
            const scoring = (0, leadScorer_1.calculateLeadScore)(lead);
            lead.leadScore = scoring.score;
            lead.leadScoreCategory = scoring.category;
            lead.scoreFactors = scoring.factors;
            lead.updatedAt = new Date();
            if (!updatedLead)
                updatedLead = lead;
        }
        if (!updatedLead) {
            return res.status(404).json({ success: false, message: "Lead not found." });
        }
        return res.json(updatedLead);
    }
    catch (error) {
        console.error("Add Note Error:", error);
        return res.status(500).json({ success: false, message: "Failed to add note", error: error.message });
    }
};
exports.addNote = addNote;
// POST /api/leads/bulk-delete - Bulk Delete Leads (Admin Only)
const bulkDeleteLeads = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "Array of lead IDs is required." });
        }
        if (db_1.isMongoConnected) {
            try {
                const validMongoIds = ids.filter((id) => mongoose_1.default.isValidObjectId(id));
                if (validMongoIds.length > 0) {
                    await Lead_1.default.deleteMany({ _id: { $in: validMongoIds } });
                }
            }
            catch (err) {
                console.warn("MongoDB bulkDelete error:", err.message);
            }
        }
        db_1.memoryStore.leads = db_1.memoryStore.leads.filter((l) => !ids.map(String).includes(String(l._id)));
        return res.json({ success: true, message: `${ids.length} leads deleted successfully.` });
    }
    catch (error) {
        console.error("Bulk Delete Error:", error);
        return res.status(500).json({ success: false, message: "Bulk delete failed", error: error.message });
    }
};
exports.bulkDeleteLeads = bulkDeleteLeads;
// POST /api/leads/bulk-update - Bulk Update Stage / Priority
const bulkUpdateLeads = async (req, res) => {
    try {
        const { ids, updates } = req.body;
        if (!Array.isArray(ids) || ids.length === 0 || !updates) {
            return res.status(400).json({ success: false, message: "IDs and update fields are required." });
        }
        if (updates.status)
            updates.status = normalizeStatus(updates.status);
        if (updates.priority)
            updates.priority = normalizePriority(updates.priority);
        if (db_1.isMongoConnected) {
            try {
                const validMongoIds = ids.filter((id) => mongoose_1.default.isValidObjectId(id));
                if (validMongoIds.length > 0) {
                    await Lead_1.default.updateMany({ _id: { $in: validMongoIds } }, { $set: updates });
                }
            }
            catch (err) {
                console.warn("MongoDB bulkUpdate error:", err.message);
            }
        }
        db_1.memoryStore.leads = db_1.memoryStore.leads.map((lead) => {
            if (ids.map(String).includes(String(lead._id))) {
                return { ...lead, ...updates, updatedAt: new Date() };
            }
            return lead;
        });
        return res.json({ success: true, message: `${ids.length} leads updated successfully.` });
    }
    catch (error) {
        console.error("Bulk Update Error:", error);
        return res.status(500).json({ success: false, message: "Bulk update failed", error: error.message });
    }
};
exports.bulkUpdateLeads = bulkUpdateLeads;
// POST /api/leads/import - Bulk Import from CSV
const importLeads = async (req, res) => {
    try {
        const { leads } = req.body;
        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ success: false, message: "Array of lead objects is required." });
        }
        const processedLeads = [];
        const author = req.user?.name || "Import Engine";
        for (const item of leads) {
            if (!item.name || !item.email)
                continue;
            const scoring = (0, leadScorer_1.calculateLeadScore)(item);
            const leadObj = {
                name: String(item.name).trim(),
                email: String(item.email).toLowerCase().trim(),
                phone: item.phone || "",
                company: item.company || "Company",
                jobTitle: item.jobTitle || "Contact",
                dealValue: Number(item.dealValue || 0),
                currency: item.currency || "USD",
                status: normalizeStatus(item.status),
                priority: normalizePriority(item.priority),
                source: normalizeSource(item.source),
                assignedTo: item.assignedTo || author,
                leadScore: scoring.score,
                leadScoreCategory: scoring.category,
                scoreFactors: scoring.factors,
                tags: Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(",") : []),
                notes: [
                    {
                        author,
                        content: "Lead imported via CSV batch upload.",
                        type: "note",
                        createdAt: new Date(),
                    },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            processedLeads.push(leadObj);
        }
        if (db_1.isMongoConnected) {
            try {
                await Lead_1.default.insertMany(processedLeads);
            }
            catch (err) {
                console.warn("MongoDB insertMany error, adding to local store:", err.message);
            }
        }
        const timestamped = processedLeads.map((l, i) => ({
            _id: `lead_imp_${Date.now()}_${i}`,
            ...l,
        }));
        db_1.memoryStore.leads.unshift(...timestamped);
        return res.status(201).json({
            success: true,
            message: `Successfully imported ${processedLeads.length} leads.`,
            count: processedLeads.length,
        });
    }
    catch (error) {
        console.error("Import Leads Error:", error);
        return res.status(500).json({ success: false, message: "Import failed", error: error.message });
    }
};
exports.importLeads = importLeads;
// GET /api/leads/analytics - Real-time Aggregate KPI & Funnel Metrics
const getAnalytics = async (_req, res) => {
    try {
        let allLeads = [];
        if (db_1.isMongoConnected) {
            try {
                allLeads = await Lead_1.default.find({});
            }
            catch (err) {
                console.warn("MongoDB getAnalytics query error, using local store:", err.message);
                allLeads = db_1.memoryStore.leads;
            }
        }
        else {
            allLeads = db_1.memoryStore.leads;
        }
        // If mongo returned empty leads but memory has leads, use memory store
        if (allLeads.length === 0 && db_1.memoryStore.leads.length > 0) {
            allLeads = db_1.memoryStore.leads;
        }
        const totalLeads = allLeads.length;
        let pipelineValue = 0;
        let wonRevenue = 0;
        let lostValue = 0;
        let wonCount = 0;
        let hotLeadsCount = 0;
        const statusCounts = {
            New: { count: 0, value: 0 },
            Contacted: { count: 0, value: 0 },
            "In Progress": { count: 0, value: 0 },
            Qualified: { count: 0, value: 0 },
            "Proposal Sent": { count: 0, value: 0 },
            Won: { count: 0, value: 0 },
            Lost: { count: 0, value: 0 },
        };
        const sourceCounts = {
            Website: 0,
            LinkedIn: 0,
            Instagram: 0,
            "Google Ads": 0,
            Referral: 0,
            "Cold Outreach": 0,
            Event: 0,
            Other: 0,
        };
        const priorityCounts = {
            Low: 0,
            Medium: 0,
            High: 0,
            Urgent: 0,
        };
        for (const lead of allLeads) {
            const val = Number(lead.dealValue || 0);
            pipelineValue += val;
            if (lead.status === "Won") {
                wonRevenue += val;
                wonCount++;
            }
            else if (lead.status === "Lost") {
                lostValue += val;
            }
            if (lead.leadScoreCategory === "Hot" || (lead.leadScore && lead.leadScore >= 75)) {
                hotLeadsCount++;
            }
            // Status breakdown
            const st = lead.status || "New";
            if (!statusCounts[st]) {
                statusCounts[st] = { count: 0, value: 0 };
            }
            statusCounts[st].count++;
            statusCounts[st].value += val;
            // Source breakdown
            const src = lead.source || "Website";
            sourceCounts[src] = (sourceCounts[src] || 0) + 1;
            // Priority breakdown
            const prio = lead.priority || "Medium";
            priorityCounts[prio] = (priorityCounts[prio] || 0) + 1;
        }
        const conversionRate = totalLeads > 0 ? Number(((wonCount / totalLeads) * 100).toFixed(1)) : 0;
        const avgDealSize = totalLeads > 0 ? Math.round(pipelineValue / totalLeads) : 0;
        return res.json({
            success: true,
            totalLeads,
            pipelineValue,
            wonRevenue,
            lostValue,
            conversionRate,
            avgDealSize,
            hotLeadsCount,
            statusCounts,
            sourceCounts,
            priorityCounts,
        });
    }
    catch (error) {
        console.error("Analytics Error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate analytics", error: error.message });
    }
};
exports.getAnalytics = getAnalytics;
