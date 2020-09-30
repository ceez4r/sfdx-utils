import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import openBrowser = require('opn');
import {Domain, Network} from '../../../shared/typesDef';
// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('utils', 'org');

export default class CommunityLogin extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx utils:community:login -n example -u scratchOrgAlias -x username -p password`
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: messages.getMessage('nameFlagDescription')}),
    username: flags.string({char: 'x', description: messages.getMessage('usernameFlagDescription')}),
    password: flags.string({char: 'p', description: messages.getMessage('passFlagDescription')}),
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const name = this.flags.name || 'world';

    const conn = this.org.getConnection();
    const domainQuery = `SELECT Domain FROM Domain LIMIT 1`;
    const networkQuery = `SELECT Name, UrlPathPrefix FROM Network WHERE Name = '${name}'`;

    const domain = await conn.query<Domain>(domainQuery);
    const network = await conn.query<Network>(networkQuery);

    if (!domain.records || domain.records.length <= 0 || !network.records || network.records.length <= 0) {
      throw new Error(`No community found with name:  ${name}`);
    }

    const domainUrl = domain.records[0].Domain;
    const communityUrlPathPrefix = network.records[0].UrlPathPrefix;
    const urlToCommunity = 'https://' + domainUrl + '/' + communityUrlPathPrefix + '/s/login';

    this.ux.log(urlToCommunity);

    await openBrowser(urlToCommunity, { app: '', wait: false });

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId(), urlToCommunity };
  }
}
