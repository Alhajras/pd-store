import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrelloService {
  private apiKey = 'da5894882047bb3d1a0f038de73f8aed';
  private apiToken = 'ATTAf9eeaa62a8f1b222520ebadf517c62e6f65ba61af5b1fd584c6ab59c77759bbe4F2FB3BE';

  constructor(private http: HttpClient) {}

  // Create headers for OAuth authentication
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `OAuth oauth_consumer_key="${this.apiKey}", oauth_token="${this.apiToken}"`,
      'Content-Type': 'application/json'
    });
  }

  // Get all lists from a board
  getLists(boardId: string): Observable<any> {
    const url = `https://api.trello.com/1/boards/${boardId}/lists`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  // Add a new list to a board
  addList(boardId: string, listName: string): Observable<any> {
    const url = `https://api.trello.com/1/lists`;
    const body = { name: listName, idBoard: boardId };

    return this.http.post(url, body, { headers: this.getHeaders() });
  }

  addCardToList(listId: string, cardName: string, cardDesc: string): Observable<any> {
    const url = `https://api.trello.com/1/cards?idList=${listId}&name=${encodeURIComponent(cardName)}&desc=${encodeURIComponent(cardDesc)}&key=${this.apiKey}&token=${this.apiToken}`;
    
    return this.http.post(url, {});
  }
}
