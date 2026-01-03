const LeadRepository = require('../../../Infrastructure/Repositories/LeadRepository');
const Lead = require('../../../Domain/Entities/Lead');
const LeadInteraction = require('../../../Domain/Entities/LeadInteraction');
const LeadStatusHistory = require('../../../Domain/Entities/LeadStatusHistory');

jest.mock('../../../Domain/Entities/Lead');
jest.mock('../../../Domain/Entities/LeadInteraction');
jest.mock('../../../Domain/Entities/LeadStatusHistory');

describe('LeadRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();

    });

    describe('Tạo Lead', () => {
        it('tạo mới lead', async () => {
            const leadData = { full_name: 'John', email: 'john@email.com', phone: '123' };
            Lead.create.mockResolvedValue(leadData);

            const result = await LeadRepository.create(leadData);

            expect(Lead.create).toHaveBeenCalledWith(leadData, { transaction: undefined });
            expect(result).toEqual(leadData);
        });

        it('tạo lead với transaction', async () => {
            const leadData = { full_name: 'John', email: 'john@email.com' };
            const transaction = {};
            Lead.create.mockResolvedValue(leadData);

            const result = await LeadRepository.create(leadData, { transaction });

            expect(Lead.create).toHaveBeenCalledWith(leadData, { transaction });
            expect(result).toEqual(leadData);
        });
    });

    describe('Cập nhật lead', () => {
        it('cập nhật lead khi tồn tại', async () => {
            const mockLead = { lead_id: 1, full_name: 'John', update: jest.fn().mockResolvedValue() };
            Lead.findByPk.mockResolvedValue(mockLead);

            const result = await LeadRepository.update(1, { full_name: 'Jane' });

            expect(Lead.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
            expect(mockLead.update).toHaveBeenCalledWith({ full_name: 'Jane' }, { transaction: undefined });
            expect(result).toEqual(mockLead);
        });

        it('trả về null khi lead không tồn tại', async () => {
            Lead.findByPk.mockResolvedValue(null);

            const result = await LeadRepository.update(999, { full_name: 'X' });

            expect(result).toBeNull();
        });
    });

    describe('Cập nhật lead theo id', () => {
        it('cập nhật lead và trả về updated instance', async () => {
            const updatedLead = { lead_id: 1, full_name: 'Jane' };
            Lead.update.mockResolvedValue([1]);
            Lead.findByPk.mockResolvedValue(updatedLead);

            const result = await LeadRepository.updateById(1, { full_name: 'Jane' });

            expect(Lead.update).toHaveBeenCalledWith(
                { full_name: 'Jane' },
                { where: { lead_id: 1 }, transaction: undefined }
            );
            expect(result).toEqual(updatedLead);
        });
    });

    describe('Cập nhật tags', () => {
        it('thêm tags khi mode = add', async () => {
            const mockLead = {
                lead_id: 1,
                tags: ['hot'],
                update: jest.fn().mockResolvedValue()
            };
            Lead.findByPk.mockResolvedValue(mockLead);

            const result = await LeadRepository.updateTags(1, ['vip'], 'add');

            expect(mockLead.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    tags: expect.arrayContaining(['hot', 'vip'])
                }),
                { transaction: undefined }
            );
            expect(result).toEqual(mockLead);
        });

        it('xóa tags khi mode = remove', async () => {
            const mockLead = {
                lead_id: 1,
                tags: ['hot', 'vip'],
                update: jest.fn().mockResolvedValue()
            };
            Lead.findByPk.mockResolvedValue(mockLead);

            const result = await LeadRepository.updateTags(1, ['vip'], 'remove');

            expect(mockLead.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    tags: ['hot']
                }),
                { transaction: undefined }
            );
        });

        it('thay thế tags khi mode = replace', async () => {
            const mockLead = {
                lead_id: 1,
                tags: ['old'],
                update: jest.fn().mockResolvedValue()
            };
            Lead.findByPk.mockResolvedValue(mockLead);

            await LeadRepository.updateTags(1, ['new1', 'new2'], 'replace');

            expect(mockLead.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    tags: ['new1', 'new2']
                }),
                { transaction: undefined }
            );
        });

        it('trả về null khi lead không tồn tại', async () => {
            Lead.findByPk.mockResolvedValue(null);

            const result = await LeadRepository.updateTags(999, ['vip'], 'add');

            expect(result).toBeNull();
        });
    });

    describe('Tìm lead theo id', () => {
        it('trả về lead khi tìm thấy', async () => {
            const mockLead = { lead_id: 1, full_name: 'John', email: 'john@email.com' };
            Lead.findByPk.mockResolvedValue(mockLead);

            const result = await LeadRepository.findById(1);

            expect(Lead.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
            expect(result).toEqual(mockLead);
        });

        it('trả về null khi không tìm thấy', async () => {
            Lead.findByPk.mockResolvedValue(null);

            const result = await LeadRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('Tìm lead theo email', () => {
        it('trả về lead khi tìm thấy', async () => {
            const mockLead = { lead_id: 1, email: 'john@email.com' };
            Lead.findOne.mockResolvedValue(mockLead);

            const result = await LeadRepository.findByEmail('john@email.com');

            expect(Lead.findOne).toHaveBeenCalledWith({ where: { email: 'john@email.com' }, transaction: undefined });
            expect(result).toEqual(mockLead);
        });

        it('trả về null khi không tìm thấy', async () => {
            Lead.findOne.mockResolvedValue(null);

            const result = await LeadRepository.findByEmail('unknown@email.com');

            expect(result).toBeNull();
        });
    });

    describe('Tìm lead theo SDT', () => {
        it('trả về lead khi tìm thấy', async () => {
            const mockLead = { lead_id: 1, phone: '123' };
            Lead.findOne.mockResolvedValue(mockLead);

            const result = await LeadRepository.findByPhone('123');

            expect(Lead.findOne).toHaveBeenCalledWith({ where: { phone: '123' }, transaction: undefined });
            expect(result).toEqual(mockLead);
        });
    });

    describe('Lấy tất cả các leads', () => {
        it('trả về tất cả leads với default order', async () => {
            const mockLeads = [
                { lead_id: 1, full_name: 'John' },
                { lead_id: 2, full_name: 'Jane' }
            ];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.findAll();

            expect(Lead.findAll).toHaveBeenCalledWith({
                where: {},
                order: [['created_at', 'DESC']],
                transaction: undefined
            });
            expect(result).toEqual(mockLeads);
        });

        it('lấy leads với custom where clause', async () => {
            const mockLeads = [{ lead_id: 1, status: 'hot' }];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.findAll({ where: { status: 'hot' } });

            expect(Lead.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'hot' }
                })
            );
            expect(result).toEqual(mockLeads);
        });
    });

    describe('Lấy leads theo status', () => {
        it('trả về leads grouped by status', async () => {
            const mockRows = [
                { status: 'hot', count: 5, sum_value: '500' },
                { status: 'warm', count: 10, sum_value: '1000' }
            ];
            Lead.findAll.mockResolvedValue(mockRows);

            const result = await LeadRepository.getLeadsGroupedByStatus();

            expect(Lead.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    group: ['status']
                })
            );
            expect(result).toEqual(mockRows);
        });
    });

    describe('Tạo lead', () => {
        it('tạo mới lead nếu không có lead_id', async () => {
            const leadData = { full_name: 'John' };
            Lead.create.mockResolvedValue(leadData);

            const result = await LeadRepository.save(leadData);

            expect(Lead.create).toHaveBeenCalledWith(leadData, { transaction: undefined });
            expect(result).toEqual(leadData);
        });

        it('cập nhật lead nếu đã tồn tại', async () => {
            const leadData = { lead_id: 1, full_name: 'John' };
            const mockInstance = { toJSON: () => leadData, update: jest.fn().mockResolvedValue() };
            Lead.findByPk.mockResolvedValue(mockInstance);

            const result = await LeadRepository.save(mockInstance);

            expect(Lead.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
            expect(mockInstance.update).toHaveBeenCalled();
            expect(result).toEqual(mockInstance);
        });
    });

    describe('Xóa lead', () => {
        it('xóa lead theo ID', async () => {
            Lead.destroy.mockResolvedValue(1);

            await LeadRepository.delete(1);

            expect(Lead.destroy).toHaveBeenCalledWith({ where: { lead_id: 1 }, transaction: undefined });
        });
    });

    describe('Tìm lead theo status', () => {
        it('trả về leads theo status', async () => {
            const mockLeads = [{ lead_id: 1, status: 'hot' }];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.findByStatus('hot');

            expect(Lead.findAll).toHaveBeenCalledWith({
                where: { status: 'hot' },
                order: [['updated_at', 'DESC']],
                transaction: undefined
            });
            expect(result).toEqual(mockLeads);
        });
    });

    describe('Tìm lead theo nguồn(source)', () => {
        it('tìm leads theo lead_source', async () => {
            const mockLeads = [{ lead_id: 1, lead_source: 'facebook' }];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.findBySource('facebook');

            expect(Lead.findAll).toHaveBeenCalledWith({
                where: { lead_source: 'facebook' },
                order: [['updated_at', 'DESC']],
                transaction: undefined
            });
            expect(result).toEqual(mockLeads);
        });

        it('tìm leads theo source_detail', async () => {
            const mockLeads = [{ lead_id: 1, lead_source: 'facebook', source_detail: 'ads' }];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.findBySource('facebook', 'ads');

            expect(Lead.findAll).toHaveBeenCalledWith({
                where: { lead_source: 'facebook', source_detail: 'ads' },
                order: [['updated_at', 'DESC']],
                transaction: undefined
            });
            expect(result).toEqual(mockLeads);
        });
    });

    describe('Tìm kiếm', () => {
        it('tìm kiếm theo full_name', async () => {
            const mockLeads = [{ lead_id: 1, full_name: 'John Doe' }];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.search('john');

            expect(Lead.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 50
                })
            );
            expect(result).toEqual(mockLeads);
        });

        it('trả về mảng rỗng nếu query rỗng', async () => {
            const result = await LeadRepository.search('');

            expect(result).toEqual([]);
            expect(Lead.findAll).not.toHaveBeenCalled();
        });
    });


    describe('logStatusChange', () => {
        it('thay đổi status và ghi history', async () => {
            const mockLead = { lead_id: 1, status: 'new', update: jest.fn().mockResolvedValue() };
            const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };

            //Gán mock context
            LeadRepository.Lead = Lead;
            LeadRepository.LeadStatusHistory = LeadStatusHistory;


            Lead.findByPk.mockResolvedValue(mockLead);
            LeadStatusHistory.create.mockResolvedValue({});


            LeadRepository.sequelize = {
                transaction: jest.fn(cb => cb(mockTransaction))
            };

            await LeadRepository.logStatusChange(1, 'hot', { reason: 'high score' });

            expect(Lead.findByPk).toHaveBeenCalledWith(
                1,
                {
                    transaction: mockTransaction,
                    lock: mockTransaction.LOCK.UPDATE
                }
            );

            expect(LeadStatusHistory.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    lead_id: 1,
                    from_status: 'new',
                    to_status: 'hot',
                    reason: 'high score',
                }),
                { transaction: mockTransaction }
            );
            expect(mockLead.update).toHaveBeenCalledWith(
                { status: 'hot' },
                { transaction: mockTransaction }
            );
        });

        it('trả về null nếu lead không tồn tại', async () => {
            Lead.findByPk.mockResolvedValue(null);
            // Bên repository, sequelize dùng là this.sequelize (this trỏ đến LeadRepository)
            LeadRepository.sequelize = {
                transaction: jest.fn(cb => cb({ LOCK: { UPDATE: 'UPDATE' } }))
            };

            const result = await LeadRepository.logStatusChange(999, 'hot');

            expect(result).toBeNull();
        });
    });

    describe('Cập nhật status', () => {
        it('alias updateStatus gọi logStatusChange', async () => {
            const mockLead = { lead_id: 1, status: 'new', update: jest.fn().mockResolvedValue() };
            Lead.findByPk.mockResolvedValue(mockLead);
            LeadStatusHistory.create.mockResolvedValue({});
            LeadRepository.sequelize = {
                transaction: jest.fn(cb => cb({ LOCK: { UPDATE: 'UPDATE' } }))
            };

            await LeadRepository.updateStatus(1, 'hot');

            expect(Lead.findByPk).toHaveBeenCalled();
        });
    });

    describe('Lấy lịch sử status', () => {
        it('trả về status history của lead', async () => {
            const mockHistory = [
                { lead_id: 1, from_status: 'new', to_status: 'hot' }
            ];
            LeadStatusHistory.findAll.mockResolvedValue(mockHistory);

            const result = await LeadRepository.getStatusHistory(1);

            expect(LeadStatusHistory.findAll).toHaveBeenCalledWith({
                where: { lead_id: 1 },
                order: [['changed_at', 'DESC']],
                limit: 50,
                offset: 0,
                transaction: undefined
            });
            expect(result).toEqual(mockHistory);
        });

        it('trả về mảng rỗng nếu LeadStatusHistory không tồn tại', async () => {
            LeadRepository.LeadStatusHistory = null;

            const result = await LeadRepository.getStatusHistory(1);

            expect(result).toEqual([]);
        });
    });



    describe('Thêm interaction', () => {
        it('thêm interaction mới', async () => {
            const mockLead = { lead_id: 1, lead_score: 50, update: jest.fn().mockResolvedValue() };
            const mockInteraction = { interaction_id: 1, type: 'call' };
            Lead.findByPk.mockResolvedValue(mockLead);
            LeadInteraction.create.mockResolvedValue(mockInteraction);
            LeadRepository.sequelize = {
                transaction: jest.fn(cb => cb({ LOCK: { UPDATE: 'UPDATE' } }))
            };

            const result = await LeadRepository.addInteraction(1, {
                type: 'call',
                channel: 'phone',
                score_delta: 10
            });

            expect(Lead.findByPk).toHaveBeenCalled();
            expect(LeadInteraction.create).toHaveBeenCalled();
            expect(result).toEqual(mockInteraction);
        });

        it('cập nhật lead_score khi score_delta không bằng 0', async () => {
            const mockLead = { lead_id: 1, lead_score: 50, update: jest.fn().mockResolvedValue() };
            Lead.findByPk.mockResolvedValue(mockLead);
            LeadInteraction.create.mockResolvedValue({});
            Lead.sequelize = {
                transaction: jest.fn(cb => cb({ LOCK: { UPDATE: 'UPDATE' } }))
            };

            await LeadRepository.addInteraction(1, { type: 'email', score_delta: 5 });

            expect(mockLead.update).toHaveBeenCalledWith(
                expect.objectContaining({ lead_score: 55 }),
                expect.any(Object)
            );
        });

        it('trả về null nếu lead không tồn tại', async () => {
            Lead.findByPk.mockResolvedValue(null);
            Lead.sequelize = {
                transaction: jest.fn(cb => cb({ LOCK: { UPDATE: 'UPDATE' } }))
            };

            const result = await LeadRepository.addInteraction(999, { type: 'call' });

            expect(result).toBeNull();
        });
    });

    describe('Lấy interaction', () => {
        it('lấy interactions của lead', async () => {
            const mockInteractions = [{ interaction_id: 1, type: 'call' }];
            LeadInteraction.findAll.mockResolvedValue(mockInteractions);

            const result = await LeadRepository.getInteractions(1);

            expect(LeadInteraction.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { lead_id: 1 },
                    limit: 100,
                    offset: 0
                })
            );
            expect(result).toEqual(mockInteractions);
        });

        it('lọc interactions theo type', async () => {
            const mockInteractions = [{ interaction_id: 1, type: 'call' }];
            LeadInteraction.findAll.mockResolvedValue(mockInteractions);

            await LeadRepository.getInteractions(1, { type: 'call' });

            expect(LeadInteraction.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ type: 'call' })
                })
            );
        });

        it('lọc interactions theo channel', async () => {
            const mockInteractions = [{ interaction_id: 1, channel: 'email' }];
            LeadInteraction.findAll.mockResolvedValue(mockInteractions);

            await LeadRepository.getInteractions(1, { channel: 'email' });

            expect(LeadInteraction.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ channel: 'email' })
                })
            );
        });
    });

    describe('Danh sách interaction', () => {
        it('trả về danh sách interactions của lead', async () => {
            const mockInteractions = [{ interaction_id: 1, type: 'call' }];
            LeadInteraction.findAll.mockResolvedValue(mockInteractions);

            const result = await LeadRepository.listInteractions(1);

            expect(LeadInteraction.findAll).toHaveBeenCalledWith({
                where: { lead_id: 1 },
                order: [['occurred_at', 'DESC']],
                transaction: undefined
            });
            expect(result).toEqual(mockInteractions);
        });

        it('trả về mảng rỗng nếu LeadInteraction không tồn tại', async () => {
            LeadRepository.LeadInteraction = null;

            const result = await LeadRepository.listInteractions(1);

            expect(result).toEqual([]);
        });
    });

    describe('listStatusHistory', () => {
        it('trả về danh sách status history của lead', async () => {
            const mockHistory = [{ lead_id: 1, from_status: 'new', to_status: 'hot' }];
            LeadRepository.LeadStatusHistory = LeadStatusHistory;
            LeadStatusHistory.findAll.mockResolvedValue(mockHistory);

            const result = await LeadRepository.listStatusHistory(1);

            expect(LeadStatusHistory.findAll).toHaveBeenCalledWith({
                where: { lead_id: 1 },
                order: [['changed_at', 'DESC']],
                transaction: undefined
            });
            expect(result).toEqual(mockHistory);
        });
    });

    describe('Xóa tương tác', () => {
        it('xóa interaction theo ID', async () => {
            LeadInteraction.destroy.mockResolvedValue(1);
            // Giả lập LeadInteraction trong LeadRepository
            LeadRepository.LeadInteraction = LeadInteraction;
            const result = await LeadRepository.deleteInteraction(1);

            expect(LeadInteraction.destroy).toHaveBeenCalledWith({
                where: { interaction_id: 1 },
                transaction: undefined
            });
            expect(result).toBe(1);
        });

        it('trả về 0 nếu LeadInteraction không tồn tại', async () => {
            LeadRepository.LeadInteraction = null;

            const result = await LeadRepository.deleteInteraction(999);

            expect(result).toBe(0);
        });
    });

    describe('Lấy các hoạt động gần đây', () => {
        it('trả về recent activities', async () => {
            const mockActivities = [{ interaction_id: 1, type: 'call' }];
            LeadRepository.LeadInteraction = LeadInteraction;
            LeadInteraction.findAll.mockResolvedValue(mockActivities);

            const result = await LeadRepository.getRecentActivity();

            expect(LeadInteraction.findAll).toHaveBeenCalledWith({
                where: {},
                order: [['occurred_at', 'DESC'], ['interaction_id', 'DESC']],
                limit: 50,
                transaction: undefined
            });
            expect(result).toEqual(mockActivities);
        });

        it('lọc activities theo since date', async () => {
            const mockActivities = [];
            LeadInteraction.findAll.mockResolvedValue(mockActivities);

            await LeadRepository.getRecentActivity({ since: '2025-01-01' });

            expect(LeadInteraction.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({})
                })
            );
        });
    });

    describe('Tính lại lead score', () => {
        it('tính toán lại lead score từ interactions', async () => {
            const mockLead = {
                lead_id: 1,
                lead_score: 0,
                update: jest.fn().mockResolvedValue()
            };
            LeadRepository.Lead = Lead;
            LeadRepository.LeadInteraction = LeadInteraction;
            Lead.findByPk.mockResolvedValue(mockLead);
            LeadInteraction.findAll.mockResolvedValue([{ sum: 15 }]);

            const result = await LeadRepository.recomputeLeadScore(1);

            expect(Lead.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
            expect(result).toEqual(mockLead);
        });

        it('trả về null nếu lead không tồn tại', async () => {
            Lead.findByPk.mockResolvedValue(null);
            LeadInteraction.findAll.mockResolvedValue([{ sum: 15 }]);

            const result = await LeadRepository.recomputeLeadScore(999);

            expect(result).toBeNull();
        });

        it('trả về lead nếu LeadInteraction không tồn tại', async () => {
            const mockLead = { lead_id: 1 };

            LeadRepository.LeadInteraction = null;
            LeadRepository.findById = jest.fn().mockResolvedValue(mockLead);

            const result = await LeadRepository.recomputeLeadScore(1);

            expect(LeadRepository.findById).toHaveBeenCalledWith(
                1,
                { transaction: undefined }
            );
            expect(result).toBe(mockLead);
        });

    });

    describe('Tổng hợp theo status', () => {
        it('trả về aggregated stats theo status', async () => {
            const mockStats = [
                { status: 'hot', count: 5 },
                { status: 'warm', count: 10 }
            ];
            // Tạo mock cho phương thức query của sequelize
            const mockSequelize = {
                query: jest.fn().mockResolvedValue([mockStats]),
            };
            // Gán mock sequelize cho LeadRepository
            LeadRepository.sequelize = mockSequelize;

            const result = await LeadRepository.aggregateByStatus();

            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT status'),
                { transaction: undefined }
            );

            expect(result).toEqual(mockStats);
        });
        it('chạy đúng với transaction', async () => {
            const mockStats = [{ status: 'hot', count: 1 }];
            const mockTransaction = { id: 'tx1' };

            LeadRepository.sequelize = {
                query: jest.fn().mockResolvedValue([mockStats]),
            };

            const result = await LeadRepository.aggregateByStatus({
                transaction: mockTransaction,
            });

            expect(LeadRepository.sequelize.query).toHaveBeenCalledWith(
                expect.any(String),
                { transaction: mockTransaction }
            );

            expect(result).toEqual(mockStats);
        });

    });


    describe('Tìm lead', () => {
        it('trả về leads với score cao nhất', async () => {
            const mockLeads = [{ lead_id: 1, lead_score: 80 }];
            Lead.findAll.mockResolvedValue(mockLeads);

            const result = await LeadRepository.findHot(70);

            expect(Lead.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({}),
                order: [['lead_score', 'DESC']],
                limit: 100,
                transaction: undefined
            });
            expect(result).toEqual(mockLeads);
        });

        it('sử dụng minScore custom', async () => {
            const mockLeads = [];
            Lead.findAll.mockResolvedValue(mockLeads);

            await LeadRepository.findHot(50, 200);

            expect(Lead.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({}),
                order: [['lead_score', 'DESC']],
                limit: 200,
                transaction: undefined
            });
        });
    });
});
