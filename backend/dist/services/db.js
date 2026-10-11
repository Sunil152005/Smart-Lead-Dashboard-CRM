"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryStore = exports.isMongoConnected = void 0;
exports.initDatabase = initDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Lead_1 = __importDefault(require("../models/Lead"));
const User_1 = __importDefault(require("../models/User"));
const leadScorer_1 = require("./leadScorer");
exports.isMongoConnected = false;
exports.memoryStore = {
    users: [],
    leads: [],
};
const initialUsers = [
    {
        _id: "user_admin_001",
        name: "Rahul Sharma (Admin)",
        email: "rahul@gmail.com",
        role: "ADMIN",
        password: "123456", // Will be hashed
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        createdAt: new Date("2026-01-10"),
    },
    {
        _id: "user_sales_002",
        name: "Priya Patel (Sales Rep)",
        email: "priya@sales.com",
        role: "SALES",
        password: "123456", // Will be hashed
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        createdAt: new Date("2026-01-15"),
    },
];
const initialLeads = [
    {
        name: "David Miller",
        email: "david.miller@titanmfg.com",
        phone: "+1 (555) 234-8901",
        company: "Titan Manufacturing",
        jobTitle: "VP of Operations",
        dealValue: 95000,
        currency: "USD",
        status: "Proposal Sent",
        priority: "Urgent",
        source: "LinkedIn",
        assignedTo: "Rahul Sharma",
        tags: ["Enterprise", "Manufacturing", "Q3 Priority"],
        notes: [
            {
                author: "Rahul Sharma",
                content: "Met with David and the CTO. Customized ERP proposal sent for 500 licenses.",
                type: "stage_change",
                createdAt: new Date("2026-03-01"),
            },
            {
                author: "Rahul Sharma",
                content: "Budget approved by board. Expecting signed contract by Friday.",
                type: "call",
                createdAt: new Date("2026-03-03"),
            },
        ],
        followUpDate: new Date("2026-03-12"),
    },
    {
        name: "Elena Rostova",
        email: "e.rostova@finedgecap.com",
        phone: "+1 (555) 987-6543",
        company: "FinEdge Capital",
        jobTitle: "Head of Digital Transformation",
        dealValue: 75000,
        currency: "USD",
        status: "Qualified",
        priority: "High",
        source: "Referral",
        assignedTo: "Priya Patel",
        tags: ["Fintech", "Security", "High Budget"],
        notes: [
            {
                author: "Priya Patel",
                content: "Security audit compliance requirements gathered. Decision maker meeting scheduled.",
                type: "note",
                createdAt: new Date("2026-03-02"),
            },
        ],
        followUpDate: new Date("2026-03-14"),
    },
    {
        name: "Jessica White",
        email: "jessica@bluewaveenergy.io",
        phone: "+1 (555) 345-6789",
        company: "BlueWave Energy",
        jobTitle: "Chief Technology Officer",
        dealValue: 60000,
        currency: "USD",
        status: "Won",
        priority: "Urgent",
        source: "Website",
        assignedTo: "Rahul Sharma",
        tags: ["CleanTech", "Multi-Year", "Closed Won"],
        notes: [
            {
                author: "Rahul Sharma",
                content: "Contract signed! Onboarding kickoff call scheduled for next Monday.",
                type: "stage_change",
                createdAt: new Date("2026-02-28"),
            },
        ],
        followUpDate: null,
    },
    {
        name: "Priya Sundaram",
        email: "priya.s@zeta-ai.tech",
        phone: "+91 98201 45678",
        company: "Zeta AI Labs",
        jobTitle: "Founder & CEO",
        dealValue: 55000,
        currency: "USD",
        status: "In Progress",
        priority: "High",
        source: "Event",
        assignedTo: "Priya Patel",
        tags: ["AI/ML", "ScaleUp", "High Potential"],
        notes: [
            {
                author: "Priya Patel",
                content: "Product demo went extremely well. Reviewing custom API integration requirements.",
                type: "call",
                createdAt: new Date("2026-03-04"),
            },
        ],
        followUpDate: new Date("2026-03-10"),
    },
    {
        name: "Amit Patel",
        email: "amit.patel@nexuslogistics.in",
        phone: "+91 99887 12345",
        company: "Nexus Logistics Group",
        jobTitle: "Director of Supply Chain",
        dealValue: 32000,
        currency: "USD",
        status: "Qualified",
        priority: "Medium",
        source: "Google Ads",
        assignedTo: "Priya Patel",
        tags: ["Logistics", "India", "Fleet Track"],
        notes: [
            {
                author: "Priya Patel",
                content: "Qualified budget: $30k - $40k. Managing 12 warehouse hubs.",
                type: "note",
                createdAt: new Date("2026-03-02"),
            },
        ],
        followUpDate: new Date("2026-03-15"),
    },
    {
        name: "Carlos Mendez",
        email: "cmendez@pulsehealth.org",
        phone: "+1 (555) 876-5432",
        company: "Pulse Health Systems",
        jobTitle: "Clinical Operations Lead",
        dealValue: 24000,
        currency: "USD",
        status: "Contacted",
        priority: "Medium",
        source: "Website",
        assignedTo: "Rahul Sharma",
        tags: ["Healthcare", "HIPAA"],
        notes: [
            {
                author: "Rahul Sharma",
                content: "Introductory email sent with healthcare compliance overview whitepaper.",
                type: "email",
                createdAt: new Date("2026-03-05"),
            },
        ],
        followUpDate: new Date("2026-03-11"),
    },
    {
        name: "Sarah Jenkins",
        email: "sarah.j@cloudflowinc.com",
        phone: "+1 (555) 432-1098",
        company: "CloudFlow Inc",
        jobTitle: "Product Manager",
        dealValue: 18500,
        currency: "USD",
        status: "Proposal Sent",
        priority: "High",
        source: "LinkedIn",
        assignedTo: "Priya Patel",
        tags: ["SaaS", "Fast Followup"],
        notes: [
            {
                author: "Priya Patel",
                content: "Tier 2 SaaS plan proposal sent. Pricing discussion scheduled.",
                type: "stage_change",
                createdAt: new Date("2026-03-04"),
            },
        ],
        followUpDate: new Date("2026-03-09"),
    },
    {
        name: "Kevin Zhang",
        email: "kzhang@omnipay.global",
        phone: "+1 (555) 654-3210",
        company: "OmniPay Global",
        jobTitle: "Head of Partnerships",
        dealValue: 28000,
        currency: "USD",
        status: "In Progress",
        priority: "Medium",
        source: "Referral",
        assignedTo: "Rahul Sharma",
        tags: ["Payments", "Global"],
        notes: [
            {
                author: "Rahul Sharma",
                content: "API documentation shared with developer team.",
                type: "email",
                createdAt: new Date("2026-03-03"),
            },
        ],
        followUpDate: new Date("2026-03-13"),
    },
    {
        name: "Marcus Aurelius",
        email: "marcus@novaretail.co",
        phone: "+1 (555) 789-0123",
        company: "Nova Retail Brand",
        jobTitle: "E-Commerce Manager",
        dealValue: 14000,
        currency: "USD",
        status: "New",
        priority: "Low",
        source: "Instagram",
        assignedTo: "Priya Patel",
        tags: ["Retail", "Social Lead"],
        notes: [
            {
                author: "Priya Patel",
                content: "Inquiry received via Instagram Ad campaign. Auto-reply sent.",
                type: "note",
                createdAt: new Date("2026-03-06"),
            },
        ],
        followUpDate: new Date("2026-03-09"),
    },
    {
        name: "Rajat Gupta",
        email: "rajat@scaleuptech.io",
        phone: "+91 98111 22334",
        company: "ScaleUp Technologies",
        jobTitle: "VP of Engineering",
        dealValue: 22000,
        currency: "USD",
        status: "Contacted",
        priority: "Medium",
        source: "Cold Outreach",
        assignedTo: "Rahul Sharma",
        tags: ["Engineering", "India"],
        notes: [
            {
                author: "Rahul Sharma",
                content: "Connected on LinkedIn and shared feature comparison sheet.",
                type: "note",
                createdAt: new Date("2026-03-05"),
            },
        ],
        followUpDate: new Date("2026-03-16"),
    },
    {
        name: "Maya Lin",
        email: "maya.lin@skylinemedia.agency",
        phone: "+1 (555) 321-7654",
        company: "Skyline Media Agency",
        jobTitle: "Creative Director",
        dealValue: 6500,
        currency: "USD",
        status: "Lost",
        priority: "Low",
        source: "Website",
        assignedTo: "Priya Patel",
        tags: ["Agency", "Lost Deal"],
        notes: [
            {
                author: "Priya Patel",
                content: "Client chose another agency due to budget constraints. Keep in touch for next quarter.",
                type: "stage_change",
                createdAt: new Date("2026-02-25"),
            },
        ],
        followUpDate: null,
    },
    {
        name: "Thomas Anderson",
        email: "neo@matrixsecurity.net",
        phone: "+1 (555) 101-0101",
        company: "Matrix Security Corp",
        jobTitle: "Cybersecurity Analyst",
        dealValue: 42000,
        currency: "USD",
        status: "New",
        priority: "High",
        source: "Website",
        assignedTo: "Rahul Sharma",
        tags: ["Security", "Hot Lead"],
        notes: [],
        followUpDate: new Date("2026-03-10"),
    },
];
// Register Mongoose connection event listeners to keep isMongoConnected accurate
mongoose_1.default.connection.on("connected", () => {
    exports.isMongoConnected = true;
});
mongoose_1.default.connection.on("error", (err) => {
    console.warn("MongoDB connection warning:", err.message);
    exports.isMongoConnected = false;
});
mongoose_1.default.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Local resilient engine active.");
    exports.isMongoConnected = false;
});
async function initDatabase() {
    const mongoUri = process.env.MONGO_URI;
    // Always seed local memory store first so fallback is ready immediately
    await seedMemoryDatabase();
    if (mongoUri) {
        try {
            console.log("Connecting to MongoDB Database...");
            await mongoose_1.default.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000,
            });
            exports.isMongoConnected = true;
            console.log("MongoDB Connected Successfully!");
            await seedMongoDatabase();
            return;
        }
        catch (err) {
            console.warn("MongoDB Atlas connection unavailable:", err.message);
            console.log("Switching to Resilient Local High-Performance Database Engine.");
            exports.isMongoConnected = false;
        }
    }
    else {
        console.log("No MONGO_URI provided. Initializing Resilient Local Database Engine.");
        exports.isMongoConnected = false;
    }
}
async function seedMongoDatabase() {
    try {
        // Ensure all demo users exist in MongoDB Atlas
        for (const u of initialUsers) {
            const existing = await User_1.default.findOne({ email: u.email.toLowerCase() });
            const hashedPassword = await bcryptjs_1.default.hash(u.password, 10);
            if (!existing) {
                console.log(`Seeding demo user ${u.email} into MongoDB...`);
                await User_1.default.create({
                    name: u.name,
                    email: u.email.toLowerCase(),
                    role: u.role,
                    password: hashedPassword,
                    avatar: u.avatar,
                });
            }
            else {
                // Ensure demo password remains valid
                existing.password = hashedPassword;
                existing.role = u.role;
                if (!existing.avatar)
                    existing.avatar = u.avatar;
                await existing.save();
            }
        }
        console.log("Demo users verified in MongoDB.");
        // Seed realistic CRM leads if they don't already exist by email
        for (const item of initialLeads) {
            if (!item.email)
                continue;
            const existingLead = await Lead_1.default.findOne({ email: item.email.toLowerCase() });
            if (!existingLead) {
                const scoring = (0, leadScorer_1.calculateLeadScore)(item);
                await Lead_1.default.create({
                    ...item,
                    email: item.email.toLowerCase(),
                    leadScore: scoring.score,
                    leadScoreCategory: scoring.category,
                    scoreFactors: scoring.factors,
                });
            }
        }
        // Ensure all leads have required fields & AI scores
        const allLeads = await Lead_1.default.find({});
        for (const lead of allLeads) {
            let needsSave = false;
            if (!lead.dealValue || lead.dealValue === 0) {
                lead.dealValue = 25000;
                needsSave = true;
            }
            if (!lead.leadScore || (lead.leadScore === 50 && (!lead.scoreFactors || lead.scoreFactors.length === 0))) {
                const scoring = (0, leadScorer_1.calculateLeadScore)(lead);
                lead.leadScore = scoring.score;
                lead.leadScoreCategory = scoring.category;
                lead.scoreFactors = scoring.factors;
                needsSave = true;
            }
            if (!lead.notes) {
                lead.notes = [];
                needsSave = true;
            }
            if (!lead.tags) {
                lead.tags = [];
                needsSave = true;
            }
            if (needsSave) {
                await lead.save();
            }
        }
        console.log("CRM leads verified and scored in MongoDB.");
    }
    catch (err) {
        console.error("Error seeding MongoDB:", err.message);
    }
}
async function seedMemoryDatabase() {
    exports.memoryStore.users = [];
    for (const u of initialUsers) {
        const hashedPassword = await bcryptjs_1.default.hash(u.password, 10);
        exports.memoryStore.users.push({
            _id: u._id,
            name: u.name,
            email: u.email.toLowerCase(),
            role: u.role,
            password: hashedPassword,
            avatar: u.avatar,
            createdAt: u.createdAt,
        });
    }
    exports.memoryStore.leads = [];
    let leadIdx = 100;
    for (const item of initialLeads) {
        const scoring = (0, leadScorer_1.calculateLeadScore)(item);
        const id = `lead_${leadIdx++}`;
        exports.memoryStore.leads.push({
            _id: id,
            ...item,
            currency: item.currency || "USD",
            leadScore: scoring.score,
            leadScoreCategory: scoring.category,
            scoreFactors: scoring.factors,
            notes: (item.notes || []).map((n, i) => ({
                _id: `note_${id}_${i}`,
                ...n,
            })),
            createdAt: new Date(Date.now() - (leadIdx - 100) * 86400000),
            updatedAt: new Date(),
        });
    }
    console.log(`Local Resilient Database initialized with ${exports.memoryStore.users.length} users and ${exports.memoryStore.leads.length} leads.`);
}
