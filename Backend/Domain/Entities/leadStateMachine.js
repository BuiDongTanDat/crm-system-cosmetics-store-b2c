// backend/src/Domain/Entities/leadStateMachine.js
module.exports = {
    initial: 'new',

    // Gợi ý tự động theo interaction
    interactionHints: {
        toContacted: ({ type, channel }) =>
            ['call', 'message'].includes(type) ||
            ['chat', 'zalo', 'livechat'].includes(channel || ''),
        toClosedLost: ({ properties }) =>
            properties?.result === 'not_interested' ||
            properties?.reason === 'no_budget',
    },


    transitions: {
        new: ['contacted', 'closed_lost'],
        contacted: ['qualified', 'nurturing', 'closed_lost'],
        qualified: ['nurturing', 'converted', 'closed_lost'],
        nurturing: ['converted', 'closed_lost', 'qualified'],
        converted: [],
        closed_lost: [],
    },

    // Ngưỡng tự động khác
    thresholds: {
        qualifiedScore: 50, // lead_score >= 50 → có thể auto lên "qualified"
    },

    // Hàm kiểm tra hợp lệ chuyển trạng thái
    canTransition(from, to) {
        from = String(from || '').toLowerCase();
        to = String(to || '').toLowerCase();
        return (
            Array.isArray(this.transitions[from]) &&
            this.transitions[from].includes(to)
        );
    },
    allowedStatuses() {
        const nodes = new Set(Object.keys(this.transitions));
        Object.values(this.transitions).forEach(arr => arr.forEach(s => nodes.add(s)));
        return Array.from(nodes); // ['new','contacted',...]
    }
};
