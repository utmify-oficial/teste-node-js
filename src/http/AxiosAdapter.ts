import { HttpClient } from './HttpClient';
import axios from 'axios';

export class AxiosAdapter implements HttpClient {
  async get(url: string): Promise<any> {
    const response = await axios.get(url);
    return response.data;
  }
}
