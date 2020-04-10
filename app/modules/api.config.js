export class ApiConfig {
  // FULL URLS
  static authorizationUrl = 'https://quire.io/oauth?client_id={client-id}&redirect_uri={redirect-uri}&state={state}';
  static apiUrl = 'https://quire.io/api';

  // GET
  static getAllOrganizationsUrl = this.apiUrl + "/organization/list";
  static getAllProjectsUrl = this.apiUrl + '/project/list';
  static getProjectsByOrganizationUrl = this.apiUrl + '/project/list/{organizationOid}';

  // POST
  // static postNewTaskUrl = this.apiUrl + '/task/id/{projectId}'; // 404
  static postNewTaskUrl = this.apiUrl + '/task/{projectId}';

  // DELETE
  static deleteTaskByOidUrl = this.apiUrl + '/task/{taskOid}'
}
