const router = require('express').Router();
const upload = require("../middlewares/multer");
const adminRoute = require("../middlewares/admin");
const Portfolio = require("../controllers/portfolio.controller");
const checkAuth = require("../middlewares/is-authenticated")
router.post("/", checkAuth, adminRoute(),
    upload.fields([{
        name: 'image', maxCount: 1
    }, {
        name: 'memorandum', maxCount: 1
    }])
    , Portfolio.createPortfolio);
router.get("/", checkAuth, Portfolio.fetchPortfolios)
router.get("/:portfolioId", checkAuth, Portfolio.fetchSinglePortfolio)
router.put("/:portfolioId", checkAuth, adminRoute(), upload.fields([{
    name: 'image', maxCount: 1
}, {
    name: 'memorandum', maxCount: 1
}]), Portfolio.updatePortfolio);
router.delete("/:portfolioId", checkAuth, adminRoute(), Portfolio.deletePortfolio)
module.exports = router;