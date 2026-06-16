const express = require("express");
const sessionController = require("../controllers/sessionController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/:code", sessionController.getSessionByCode);
router.post("/", authenticate, sessionController.createSession);

module.exports = router;
