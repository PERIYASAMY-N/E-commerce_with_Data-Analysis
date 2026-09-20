const analyticsService = require('../services/analyticsService');

const validateDates = (req, res, next) => {
    const { startDate, endDate } = req.query;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({ success: false, message: 'Invalid startDate format. Use YYYY-MM-DD.' });
    }
    if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({ success: false, message: 'Invalid endDate format. Use YYYY-MM-DD.' });
    }
    if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({ success: false, message: 'startDate cannot be after endDate.' });
    }
    next();
};

const getSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getSummary(startDate, endDate);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getSummary Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve analytics summary.' });
    }
};

const getSalesTrend = async (req, res) => {
    try {
        const { startDate, endDate, groupBy } = req.query;
        const allowedGroups = ['day', 'month', 'year'];
        const group = allowedGroups.includes(groupBy) ? groupBy : 'month';
        
        const data = await analyticsService.getSalesTrend(startDate, endDate, group);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getSalesTrend Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve sales trend.' });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const data = await analyticsService.getTopProducts(startDate, endDate, limit);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getTopProducts Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve top products.' });
    }
};

const getTopCategories = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const data = await analyticsService.getTopCategories(startDate, endDate, limit);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getTopCategories Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve top categories.' });
    }
};

const getTopCustomers = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const data = await analyticsService.getTopCustomers(startDate, endDate, limit);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getTopCustomers Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve top customers.' });
    }
};

const getProductPerformance = async (req, res) => {
    try {
        const { startDate, endDate, sortBy } = req.query;
        const data = await analyticsService.getProductPerformance(startDate, endDate, sortBy);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getProductPerformance Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve product performance.' });
    }
};

const getCategoryPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getCategoryPerformance(startDate, endDate);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getCategoryPerformance Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve category performance.' });
    }
};

const getOrdersBreakdown = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getOrdersBreakdown(startDate, endDate);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getOrdersBreakdown Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve orders breakdown.' });
    }
};

const getPaymentSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getPaymentSummary(startDate, endDate);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Analytics getPaymentSummary Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve payment summary.' });
    }
};

module.exports = {
    validateDates,
    getSummary,
    getSalesTrend,
    getTopProducts,
    getTopCategories,
    getTopCustomers,
    getProductPerformance,
    getCategoryPerformance,
    getOrdersBreakdown,
    getPaymentSummary
};
