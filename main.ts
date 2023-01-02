// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import { Construct } from "constructs";
import { App, RemoteBackend, TerraformStack, TerraformVariable } from "cdktf";
import { AzurermProvider } from "@cdktf/provider-azurerm/lib/provider";
import { ResourceGroup } from "@cdktf/provider-azurerm/lib/resource-group";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new RemoteBackend(this, {
      hostname: process.env?.ARTIFACTORY_hostname ?? '',
      organization: process.env?.ARTIFACTORY_organization ?? '',
      token: process.env?.ARTIFACTORY_token ?? '',
      workspaces: {
        name: 'cdktf-remote-backend-artifactory',
      },
    });

    const tenantId = new TerraformVariable(this, 'tenantId', { type: 'string' }); // process.env.TF_VAR_tenantId
    const clientId = new TerraformVariable(this, 'clientId', { type: 'string' }); // process.env.TF_VAR_clientId
    const subscriptionId = new TerraformVariable(this, 'subscriptionId', { type: 'string' }); // process.env.TF_VAR_subscriptionId
    const clientSecret = new TerraformVariable(this, 'clientSecret', { type: 'string', sensitive: true }); // process.env.TF_VAR_clientSecret

    new AzurermProvider(this, 'azure-provider', {
      useOidc: true,
      tenantId: tenantId.stringValue,
      subscriptionId: subscriptionId.stringValue,
      clientId: clientId.stringValue, // this service principal has owner on the hub subscription
      clientSecret: clientSecret.stringValue,
      features: {},
    });

    new ResourceGroup(this, 'test-rg', {
      location: 'East US',
      name: 'test-rg',
    });
  }
}

const app = new App();
new MyStack(app, "cdktf-remote-backend-artifactory");
app.synth();
