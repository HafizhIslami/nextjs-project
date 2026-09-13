import { Document, Query } from "mongoose";

class APIFilters<T extends Document> {
  query: Query<T[], T>;
  queryStr: Record<string, string>;

  constructor(query: Query<T[], T>, queryStr: Record<string, string>) {
    this.query = query;
    this.queryStr = queryStr;
  }
  search(): APIFilters<T> {
    const location = this.queryStr?.location
      ? {
          address: {
            $regex: this.queryStr.location,
            $options: "i",
          },
        }
      : {};
    this.query = this.query.find({ ...location });

    return this;
  }

  filter(): APIFilters<T> {
    const queryCopy = { ...this.queryStr };

    const removeFields = ["location", "page"];
    removeFields.forEach((el) => delete queryCopy[el]);

    this.query = this.query.find(queryCopy);

    return this;
  }

  pagination(resPerPage: number): APIFilters<T> {
    const currentPage = Number(this.queryStr?.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    this.query = this.query.limit(resPerPage).skip(skip);

    return this;
  }
}

export default APIFilters;
