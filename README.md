# `deplan-client`

This package allows you to seamlessly integrate your web application with DePlan wallet.

## Installing

```sh
# npm
npm install deplan-client

# yarn
yarn add deplan-client
```

## Usage

```ts
import { DePlanClient } from 'deplan-client';

const deplanClient = new DePlanClient('PRODUCT_WALLET_ADDRESS');

// Connect
const { address } = await deplanClient.connect();

// Sign In
const { address, signature, message } = await deplanClient.signIn();
```

### ``signIn`` returns
``address`` - user wallet address
``signature`` - signature issued by DePlan
``message`` - message that was signed

Then you should pass **message** and **signature** to your backend to verify the signIn operation.

```ts
import { DePlanClient } from 'deplan-client';

const deplanClient = new DePlanClient('PRODUCT_WALLET_ADDRESS');

deplanClient.verifySignIn(req.body.message, req.body.signature, 'DEPLAN_WALLET_ADDRESS');
```

``PRODUCT_WALLET_ADDRESS`` - the address of your organization in DePlan Connect.
``DEPLAN_WALLET_ADDRESS`` - the one and only DePlan wallet address which is ``7qUPhUmL6nNTWU7yMsWueR778SYbNhBU2B2tqddfns6j``.