import express from "express";
import axios from "axios";
import { getApiKeys } from "../config/secrets.js";

const router = express.Router();

// Configuration sécurisée
const apiKeys = getApiKeys();
const STRAWPOLL_API_KEY = apiKeys.strawpoll;
const ENDPOINT = "https://api.strawpoll.com/v3/polls";

console.log("🍓 API Strawpoll configurée avec succès");

router.post("/", async (req, res) => {
  try {
    const { title, options } = req.body;
    if (!title || !options || options.length < 2) {
      return res
        .status(400)
        .json({ message: "Titre et au moins 2 options requis." });
    }

    const poll = {
      title,
      poll_options: options.map((opt) => ({ type: "text", value: opt })),
      poll_config: {
        is_private: false,
        vote_type: "default",
        allow_comments: true,
        allow_indeterminate: false,
        allow_other_option: false,
        custom_design_colors: null,
        deadline_at: null,
        duplication_checking: "ip",
        allow_vpn_voters: false,
        edit_vote_permissions: "nobody",
        force_appearance: null,
        hide_participants: false,
        is_multiple_choice: false,
        multiple_choice_min: 1,
        multiple_choice_max: options.length,
        number_of_winners: 1,
        randomize_options: false,
        require_voter_names: false,
        results_visibility: "always",
        use_custom_design: false,
      },
      poll_meta: {
        description: "",
        location: null,
      },
      type: "multiple_choice",
    };

    const strawRes = await axios.post(ENDPOINT, poll, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": STRAWPOLL_API_KEY,
      },
    });

    return res.json({ url: strawRes.data.url || strawRes.data.content_url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res
      .status(500)
      .json({
        message: "Erreur Strawpoll",
        details: err.response?.data || err.message,
      });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const pollId = req.params.id;
    if (!pollId)
      return res.status(400).json({ message: "ID du sondage requis." });
    const strawRes = await axios.get(`${ENDPOINT}/${pollId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": STRAWPOLL_API_KEY,
      },
    });
    return res.json(strawRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res
      .status(500)
      .json({
        message: "Erreur Strawpoll",
        details: err.response?.data || err.message,
      });
  }
});

export default router;
