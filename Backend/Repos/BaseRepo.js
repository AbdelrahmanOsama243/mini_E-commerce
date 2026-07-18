class BaseRepo {
  constructor(model) {
    this.model = model;
  }

  async findAll(filter = {}) {
    return await this.model.find(filter);
  }

  async findById(id) {
    return await this.model.findById(id);
  }

  async findOne(filter = {}) {
    return await this.model.findOne(filter);
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    if (this.allowedUpdates && Array.isArray(this.allowedUpdates)) {
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

    return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseRepo;
