export class ItemState {
  constructor(data) {
    this.id = data.id;
    this.novelId = data.novel_id;
    this.name = data.name;
    this.type = data.type;
    this.owner = data.owner;
    this.status = data.status;
    this.attributes = data.attributes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }
}
