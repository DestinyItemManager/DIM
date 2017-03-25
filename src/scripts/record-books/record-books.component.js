import templateUrl from './record-books.html';
import './record-books.scss';

function RecordBooksController(recordBookService) {
  this.recordBooks = recordBookService.getRecordBooks();
}

export const RecordBooksComponent = {
  bindings: {
  },
  controller: RecordBooksController,
  templateUrl: templateUrl
};
