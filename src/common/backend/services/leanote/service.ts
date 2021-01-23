import { CompleteStatus } from 'common/backend/interface';
import { DocumentService, CreateDocumentRequest } from '../../index';
import { IBasicRequestService } from '@/service/common/request';
import { Container } from 'typedi';
import LeanoteClient from '../../clients/leanote/client';
import { LeanoteBackendServiceConfig, LeanoteNotebook } from '../../clients/leanote/interface';

/**
 * Document service for self hosted leanote or leanote.com
 */
export default class LeanoteDocumentService implements DocumentService {
  private client: LeanoteClient;
  private config: LeanoteBackendServiceConfig;

  /**
   * This extension will need the user and password to connect to leanote and fetch a token
   * You must supply the one of your leanote server.
   */
  constructor(config: LeanoteBackendServiceConfig) {
    this.config = config;
    this.client = new LeanoteClient(config, Container.get(IBasicRequestService));
  }

  getId = () => {
    return this.config.email;
  };

  getUserInfo = async () => {
    return {
      name: 'leanote',
      avatar: '',
      homePage: this.config.leanote_host,
      description: `send to ${this.config.email} account on leanote`,
    };
  };

  /**
   * If not logged, login then fetch notebook as repository
   *
   * @see documentation https://github.com/leanote/leanote/wiki/leanote-api
   */
  getRepositories = async () => {
    let response = await this.client.getSyncNotebooks();
    console.log(response);
    if (response.Msg && response.Msg === 'NOTLOGIN') {
      await this.client.login();
      response = await this.client.getSyncNotebooks();
    }
    console.log(response);
    return response.map(function(leanoteNotebook: LeanoteNotebook) {
      return {
        id: leanoteNotebook.NotebookId,
        name: leanoteNotebook.Title,
        groupId: 'leanote',
        groupName: 'leanote',
      };
    });
  };

  /**
   * Use the leanote api to clip document as note in leanote
   *
   * @see documentation https://github.com/leanote/leanote/wiki/leanote-api
   */
  createDocument = async (info: CreateDocumentRequest): Promise<CompleteStatus> => {
    await this.client.createDocument(info);
    return {
      href: `${this.config.leanote_host}`,
    };
  };

  /**
   * Use the leanote api to embed image in the document as note in leanote
   *
   * @see documentation https://github.com/leanote/leanote/wiki/leanote-api
   */
  uploadBlob = async (blob: Blob): Promise<string> => {
    return this.client.uploadBlob(blob);
  };
}
