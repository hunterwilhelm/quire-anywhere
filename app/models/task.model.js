export class Task {
  _data = {
    "name": "",
    "tags": [],
    "description": "",
    "assignees": [],
    "peekaboo": false,
    "asUser": true,
    "followers": [],
    "priority": 0,
    "status": 0
  };

  constructor(name, description) {
    this._data['name'] = name;
    this._data['description'] = description + "\n\n Quire Anywhere Chrome Extension";
  }

  setRecurring() {
    this._data["recurring"] = {
      "type": 2048,
      "rate": 2048,
      "data": 6,
      "end": "2020-12-22T00:00:00.000Z"
    };
  }

  setDueDate() {
    this._data["due"] = "2018-12-22T00:00:00.000Z";
  }

  setStartDate() {
    this._data["start"] = "2018-12-20T00:00:00.000Z";
  }

  setData(data) {
    this._data = data;
  }

  toJSON() {
    return JSON.stringify(this._data);
  }
}
