const Player = require('../models/Player');
const Prospect = require('../models/Prospect');
const { generateScoutResponse } = require('../utils/aiAssistant');

/**
 * Handles natural language scouting queries.
 */
exports.askScoutAdvisor = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: "Please provide a scouting query." });
        }

        const filter = {};
        if (req.user) {
            filter.rejectedBy = { $ne: req.user._id };
        }

        // Fetch full data including career history & media
        const players = await Prospect.find(filter).limit(50).lean();
        if (!players || players.length === 0) {
            return res.status(404).json({ message: "No prospects found to analyze." });
        }

        const aiResponse = await generateScoutResponse(query, players);

        // Extract recommended players by matching names from AI output
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
                    if (
                        foundPlayer &&
                        !recommendedPlayers.find(rp => rp._id.toString() === foundPlayer._id.toString())
                    ) {
                        recommendedPlayers.push(foundPlayer);
                    }
                }
            }
        }

        // Clean up the AI text (remove RECOMMENDED_PLAYER: tags and redundant empty lines)
        const cleanAnswer = aiResponse
            .split('\n')
            .filter(l => !l.trim().startsWith('RECOMMENDED_PLAYER:'))
            .join('\n')
            .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to 2
            .trim();

        res.status(200).json({
            success: true,
            data: {
                answer: cleanAnswer,
                recommendedPlayers,
                query
            },
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Scout Advisor Error:", error);
        res.status(500).json({ success: false, message: "Failed to consult the AI Scout Advisor." });
    }
};

/**
 * Get full detailed profile of a single prospect/player.
 * Includes career history, videos, gallery images, and all stats.
 */
exports.getPlayerDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Try Prospect first, then registered Player
        let player = await Prospect.findById(id).lean();
        if (!player) {
            player = await Player.findById(id).lean();
        }
        if (!player) {
            return res.status(404).json({ success: false, message: "Player not found." });
        }

        // Ensure avatarUrl is populated
        if (!player.avatarUrl && player.imageUrl) {
            player.avatarUrl = player.imageUrl;
        }

        res.status(200).json({ success: true, data: player });
    } catch (error) {
        console.error("Error fetching player detail:", error);
        res.status(500).json({ success: false, message: "Error fetching player detail." });
    }
};

/**
 * Gets registered players without a club for the scouting pool.
 */
exports.getScoutPlayers = async (req, res) => {
    try {
        const filter = {
            clubId: null,
            status: 'pending'
        };

        if (req.user) {
            filter.rejectedBy = { $ne: req.user._id };
        }

        const players = await Player.find(filter).sort({ createdAt: -1 }).lean();
        const playersWithSource = players.map(p => ({
            ...p,
            source: 'player',
            avatarUrl: p.avatarUrl || p.imageUrl
        }));

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

        let result = await Prospect.findByIdAndUpdate(
            id,
            { $addToSet: { rejectedBy: req.user._id } },
            { new: true }
        );

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