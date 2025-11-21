#![cfg(test)]
extern crate std;

use crate::sale::{TokenSaleContract, TokenSaleContractClient};
use escrow::{Escrow, EscrowContract, EscrowContractClient, Flags, Milestone, Roles, Trustline};
use soroban_sdk::{testutils::Address as _, token, vec, Address, Env, String};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;
use soroban_token_contract::{Token as FactoryToken, TokenClient as FactoryTokenClient};

fn create_usdc_token<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(e, &sac.address()),
        TokenAdminClient::new(e, &sac.address()),
    )
}

fn create_escrow_contract<'a>(env: &Env) -> EscrowContractClient<'a> {
    EscrowContractClient::new(env, &env.register(EscrowContract {}, ()))
}

fn create_token_factory<'a>(e: &Env, admin: &Address) -> FactoryTokenClient<'a> {
    let token_contract = e.register(
        FactoryToken,
        (
            admin,
            7_u32,
            String::from_str(e, "SaleToken"),
            String::from_str(e, "SALE"),
        ),
    );
    FactoryTokenClient::new(e, &token_contract)
}

fn create_token_sale<'a>(e: &Env, escrow_addr: &Address, sale_token_addr: &Address) -> TokenSaleContractClient<'a> {
    let contract_id = e.register(TokenSaleContract, (escrow_addr.clone(), sale_token_addr.clone()));
    TokenSaleContractClient::new(e, &contract_id)
}

#[test]
fn test_buy_transfers_usdc_and_mints_sale_token() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    // 1) Create USDC
    let (usdc_client, usdc_admin) = create_usdc_token(&env, &admin);

    // 2) Create Escrow contract and minimum properties
    let escrow_client = create_escrow_contract(&env);
    let engagement_id = String::from_str(&env, "eng_1");

    let roles = Roles {
        approver: payer.clone(),
        service_provider: beneficiary.clone(),
        platform_address: admin.clone(),
        release_signer: payer.clone(),
        dispute_resolver: admin.clone(),
        receiver: beneficiary.clone(),
    };

    let flags = Flags {
        disputed: false,
        released: false,
        resolved: false,
    };

    let trustline = Trustline {
        address: usdc_client.address.clone(),
    };

    let amount: i128 = 100;
    let platform_fee: u32 = 0;

    let milestones = vec![
        &env,
        Milestone {
            description: String::from_str(&env, "m1"),
            status: String::from_str(&env, "Pending"),
            evidence: String::from_str(&env, ""),
            approved: false,
        },
    ];

    let escrow_properties = Escrow {
        engagement_id,
        title: String::from_str(&env, "Test Escrow"),
        description: String::from_str(&env, "Test Escrow Description"),
        roles,
        amount,
        platform_fee,
        milestones,
        flags,
        trustline,
        receiver_memo: 0,
    };

    escrow_client.initialize_escrow(&escrow_properties);

    // 3) Create token-factory where admin is the TokenSale contract (defined later)
    // First we create a temporary admin, then we will update with set_admin if necessary.
    let temp_admin = Address::generate(&env);
    let sale_token = create_token_factory(&env, &temp_admin);

    // 4) Create TokenSale, passing the contract id of Escrow and token-factory
    let token_sale_client = create_token_sale(&env, &escrow_client.address, &sale_token.address);

    // Now we make the real admin of the token-factory the TokenSale contract
    sale_token.set_admin(&token_sale_client.address);

    // 5) Fund USDC to the payer so they can buy
    usdc_admin.mint(&payer, &amount);

    // 6) Execute buy
    token_sale_client.buy(&usdc_client.address, &payer, &beneficiary, &amount);

    // 7) Verify that the escrow received the USDC
    let escrow_balance = usdc_client.balance(&escrow_client.address);
    assert_eq!(escrow_balance, amount);

    // 8) Verify that the beneficiary received the mint from the token-factory
    let sale_token_balance = sale_token.balance(&beneficiary);
    assert_eq!(sale_token_balance, amount);
}
