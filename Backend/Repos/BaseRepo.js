class BaseRepo {
  constructor(model) {
    this.model = model;
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort, select, populate, lean = false, session } = options;
    const skip = (page - 1) * limit;

    let query = this.model.find(filter).skip(skip).limit(Number(limit));

    if (sort) query = query.sort(sort);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();
    if (session) query = query.session(session);

    const [items, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).session(session)
    ]);

    return { items, total, page, limit: Number(limit) };
  }

  async findById(id, options = {}) {
    const { select, populate, lean = false, session } = options;
    let query = this.model.findById(id);

    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();
    if (session) query = query.session(session);

    return await query.exec();
  }

  async findOne(filter = {}, options = {}) {
    const { select, populate, lean = false, session } = options;
    let query = this.model.findOne(filter);

    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (lean) query = query.lean();
    if (session) query = query.session(session);

    return await query.exec();
  }

  async create(data, options = {}) {
    const { session } = options;
    if (session) {
      const created = await this.model.create([data], { session });
      return created[0];
    }
    return await this.model.create(data);
  }

  async update(id, data, options = {}) {
    const { session } = options;
    if (this.allowedUpdates && Array.isArray(this.allowedUpdates)) {
      if (this.allowedUpdates.length === 0) {
        throw new Error('Validation Error: Updates are not allowed for this model');
      }

      const filteredData = {};
      const updates = Object.keys(data);
      let hasValidFields = false;

      updates.forEach(update => {
        if (this.allowedUpdates.includes(update)) {
          filteredData[update] = data[update];
          hasValidFields = true;
        }
      });

      if (!hasValidFields) {
        throw new Error('Validation Error: No valid fields provided for update');
      }
      data = filteredData;
    }

    return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true, session });
  }

  async delete(id, options = {}) {
    const { session } = options;
    return await this.model.findByIdAndDelete(id, { session });
  }
}

module.exports = BaseRepo;
