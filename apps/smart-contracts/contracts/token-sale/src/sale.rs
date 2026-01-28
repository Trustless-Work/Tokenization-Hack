use soroban_sdk::{Address, Env, IntoVal, Symbol, Val, contract, contractimpl, token, vec};
use token::Client as TokenClient;

#[contract]
pub struct TokenSaleContract;

#[derive(Clone)]
pub struct Config {
    pub escrow_contract: Address,
    pub sale_token: Address,
}

fn read_config(e: &Env) -> Config {
    let escrow_key: Val = "escrow".into_val(e);
    let token_key: Val = "token".into_val(e);

    let escrow_contract: Address = e
        .storage()
        .instance()
        .get(&escrow_key)
        .unwrap();
    let sale_token: Address = e
        .storage()
        .instance()
        .get(&token_key)
        .unwrap();
    Config {
        escrow_contract,
        sale_token,
    }
}

fn write_config(e: &Env, escrow_contract: &Address, sale_token: &Address) {
    let escrow_key: Val = "escrow".into_val(e);
    let token_key: Val = "token".into_val(e);

    e.storage().instance().set(&escrow_key, escrow_contract);
    e.storage().instance().set(&token_key, sale_token);
}

fn read_admin(e: &Env) -> Address {
    let admin_key: Val = "admin".into_val(e);
    e.storage()
        .instance()
        .get(&admin_key)
        .expect("Admin not set")
}

fn write_admin(e: &Env, admin: &Address) {
    let admin_key: Val = "admin".into_val(e);
    e.storage().instance().set(&admin_key, admin);
}

#[contractimpl]
impl TokenSaleContract {
    pub fn __constructor(env: Env, escrow_contract: Address, sale_token: Address, admin: Address) {
        write_config(&env, &escrow_contract, &sale_token);
        write_admin(&env, &admin);
    }

    pub fn set_token(env: Env, new_token: Address) {
        let admin = read_admin(&env);
        admin.require_auth();

        // Update only the token address, keep escrow_contract the same
        let token_key: Val = "token".into_val(&env);
        env.storage().instance().set(&token_key, &new_token);
    }

    pub fn buy(env: Env, usdc: Address, payer: Address, beneficiary: Address, amount: i128) {
        payer.require_auth();

        let cfg = read_config(&env);

        let usdc_client = TokenClient::new(&env, &usdc);
        usdc_client.transfer(&payer, &cfg.escrow_contract, &amount);

        let mint_sym = Symbol::new(&env, "mint");
        let args_vec = vec![&env, beneficiary.into_val(&env), amount.into_val(&env)];

        let _: () = env.invoke_contract(&cfg.sale_token, &mint_sym, args_vec);
    }
}
