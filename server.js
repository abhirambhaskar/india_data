const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load all state JSON files dynamically
const statesDir = path.join(__dirname, "data");
let statesData = {};

// Helper function to load state data
const loadStateData = () => {
    try {
        fs.readdirSync(statesDir).forEach((file) => {
            if (file.endsWith(".json")) {
                const stateName = file.replace(".json", "");
                const filePath = path.join(statesDir, file);
                const fileContent = JSON.parse(fs.readFileSync(filePath, "utf8"));
                statesData[stateName] = fileContent;
            }
        });
    } catch (error) {
        console.error("Error loading state data:", error);
    }
};

// Load state data on startup
loadStateData();

// API Routes

// Get all states
app.get("/api/states", (req, res) => {
    try {
        const stateNames = Object.keys(statesData);
        res.json(stateNames);
    } catch (error) {
        res.status(500).json({ error: "Error fetching states" });
    }
});

// Get districts by state
app.get("/api/districts/:state", (req, res) => {
    try {
        const state = req.params.state;
        if (!statesData[state]) {
            return res.status(404).json({ error: "State not found" });
        }
        const districts = statesData[state].districts.map(d => d.district);
        res.json(districts);
    } catch (error) {
        res.status(500).json({ error: "Error fetching districts" });
    }
});

// Get sub-districts by district
app.get("/api/subdistricts/:state/:district", (req, res) => {
    try {
        const { state, district } = req.params;
        if (!statesData[state]) {
            return res.status(404).json({ error: "State not found" });
        }

        const districtData = statesData[state].districts.find(d => d.district === district);
        if (!districtData) {
            return res.status(404).json({ error: "District not found" });
        }

        const subDistricts = districtData.subDistricts.map(sd => sd.subDistrict);
        res.json(subDistricts);
    } catch (error) {
        res.status(500).json({ error: "Error fetching sub-districts" });
    }
});

// Get villages by sub-district
app.get("/api/villages/:state/:district/:subdistrict", (req, res) => {
    try {
        const { state, district, subdistrict } = req.params;
        if (!statesData[state]) {
            return res.status(404).json({ error: "State not found" });
        }

        const districtData = statesData[state].districts.find(d => d.district === district);
        if (!districtData) {
            return res.status(404).json({ error: "District not found" });
        }

        const subDistrictData = districtData.subDistricts.find(sd => sd.subDistrict === subdistrict);
        if (!subDistrictData) {
            return res.status(404).json({ error: "Sub-district not found" });
        }

        res.json(subDistrictData.villages);
    } catch (error) {
        res.status(500).json({ error: "Error fetching villages" });
    }
});

// Search endpoint
app.get("/api/search", (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const searchResults = {
            states: [],
            districts: [],
            subDistricts: [],
            villages: []
        };

        // Search through states
        Object.keys(statesData).forEach(state => {
            if (state.toLowerCase().includes(query.toLowerCase())) {
                searchResults.states.push(state);
            }

            // Search through districts
            statesData[state].districts.forEach(district => {
                if (district.district.toLowerCase().includes(query.toLowerCase())) {
                    searchResults.districts.push({
                        state,
                        district: district.district
                    });
                }

                // Search through sub-districts
                district.subDistricts.forEach(subDistrict => {
                    if (subDistrict.subDistrict.toLowerCase().includes(query.toLowerCase())) {
                        searchResults.subDistricts.push({
                            state,
                            district: district.district,
                            subDistrict: subDistrict.subDistrict
                        });
                    }

                    // Search through villages
                    subDistrict.villages.forEach(village => {
                        if (village.toLowerCase().includes(query.toLowerCase())) {
                            searchResults.villages.push({
                                state,
                                district: district.district,
                                subDistrict: subDistrict.subDistrict,
                                village
                            });
                        }
                    });
                });
            });
        });

        res.json(searchResults);
    } catch (error) {
        res.status(500).json({ error: "Error performing search" });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// ⚠️ IMPORTANT: Do NOT use `app.listen()` for Vercel Deployment
module.exports = app;
