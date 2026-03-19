const Player = require('../models/Player');
const Prospect = require('../models/Prospect');
const { generateScoutResponse } = require('../utils/aiAssistant');

/**
 * Handles natural language scouting queries.
 * 1. Fetches players from the DB.
 * 2. Sends them along with the query to the AI Assistant.
 */
exports.askScoutAdvisor = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ message: "Please provide a scouting query." });
        }

        // AI Advisor uses the Prospect (mock) pool for simulation
        const filter = {};
        if (req.user) {
            filter.rejectedBy = { $ne: req.user._id };
        }
        const players = await Prospect.find(filter).limit(50).lean();

        if (!players || players.length === 0) {
            return res.status(404).json({ message: "No prospects found to analyze." });
        }

        // Step 2: Get AI response
        const aiResponse = await generateScoutResponse(query, players);

        // Step 3: Extract recommended players
        const recommendedPlayers = [];
        const lines = aiResponse.split('\n');

        for (const line of lines) {
            if (line.includes('RECOMMENDED_PLAYER:')) {
                const nameMatch = line.split('RECOMMENDED_PLAYER:')[1]?.trim();
                if (nameMatch) {
                    const foundPlayer = players.find(p =>
                        nameMatch.toLowerCase().includes(p.name.toLowerCase()) ||
                        p.name.toLowerCase().includes(nameMatch.toLowerCase())
                    );
                    if (foundPlayer && !recommendedPlayers.find(rp => rp._id.toString() === foundPlayer._id.toString())) {
                        recommendedPlayers.push(foundPlayer);
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                answer: aiResponse,
                recommendedPlayers: recommendedPlayers,
                query: query
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Scout Advisor Error:", error);
        res.status(500).json({ success: false, message: "Failed to consult the AI Scout Advisor." });
    }
};

/**
 * Gets registered players without a club for the scouting pool.
 */
exports.getScoutPlayers = async (req, res) => {
    try {
        const filter = {
            clubId: null,
            status: 'pending' // Only show those awaiting a club/approval
        };

        if (req.user) {
            filter.rejectedBy = { $ne: req.user._id };
        }

        const players = await Player.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Add source field for frontend/recruitment compatibility
        const playersWithSource = players.map(p => ({ ...p, source: 'player' }));

        res.status(200).json({ success: true, data: playersWithSource });
    } catch (error) {
        console.error("Error fetching registered players for scouting:", error);
        res.status(500).json({ success: false, message: "Error fetching scouting players." });
    }
};

/**
 * Rejects a candidate (Prospect or Player) for the current manager.
 */
exports.rejectProspect = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        // Check Prospect first
        let result = await Prospect.findByIdAndUpdate(
            id,
            { $addToSet: { rejectedBy: req.user._id } },
            { new: true }
        );

        // Then Player
        if (!result) {
            result = await Player.findByIdAndUpdate(
                id,
                { $addToSet: { rejectedBy: req.user._id } },
                { new: true }
            );
        }

        if (!result) {
            return res.status(404).json({ success: false, message: "Candidate not found." });
        }

        res.status(200).json({ success: true, message: "Player hidden from your scouting views." });
    } catch (error) {
        console.error("Error rejecting candidate:", error);
        res.status(500).json({ success: false, message: "Failed to reject candidate." });
    }
};
