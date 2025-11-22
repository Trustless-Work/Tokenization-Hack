use soroban_sdk::{contract, contractimpl, token, Address, Env};
use token::Client as TokenClient;

use crate::error::ContractError;

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    pub fn __constructor(
        env: Env,
        admin: Address,
        enabled: bool,
        price: i128,
        token: Address,
        usdc: Address,
    ) {
        env.storage()
            .instance()
            .set(&"admin", &admin);

        env.storage()
            .instance()
            .set(&"enabled", &enabled);

        env.storage()
            .instance()
            .set(&"price", &price);

        env.storage()
            .instance()
            .set(&"token", &token);

        env.storage()
            .instance()
            .set(&"usdc", &usdc);
    }

    pub fn availability_for_exchange(env: Env, admin: Address, enabled: bool) -> Result<(), ContractError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&"admin")
            .ok_or(ContractError::AdminNotFound)?;

        if admin != stored_admin {
            return Err(ContractError::OnlyAdminCanChangeAvailability);
        }

        env.storage()
            .instance()
            .set(&"enabled", &enabled);
        
        Ok(())
    }

    pub fn claim(env: Env, beneficiary: Address) -> Result<(), ContractError> {
        beneficiary.require_auth();

        let enabled: bool = env
            .storage()
            .instance()
            .get(&"enabled")
            .expect("Enabled flag not found");

        if !enabled {
            return Err(ContractError::ExchangeIsCurrentlyDisabled);
        }

        let price: i128 = env
            .storage()
            .instance()
            .get(&"price")
            .expect("Price not found");

        let token_address: Address = env
            .storage()
            .instance()
            .get(&"token")
            .expect("Token address not found");

        let token_client = TokenClient::new(&env, &token_address);
        let token_balance = token_client.balance(&beneficiary);

        if token_balance == 0 {
            return Err(ContractError::BeneficiaryHasNoTokensToClaim);
        }

        let usdc_amount = (token_balance * (100 + price)) / 100;

        let usdc_address: Address = env
            .storage()
            .instance()
            .get(&"usdc")
            .expect("USDC address not found");

        let usdc_client = TokenClient::new(&env, &usdc_address);

        let vault_usdc_balance = usdc_client.balance(&env.current_contract_address());

        if vault_usdc_balance < usdc_amount {
            return Err(ContractError::VaultDoesNotHaveEnoughUSDC);
        }

        token_client.transfer(&beneficiary, &env.current_contract_address(), &token_balance);

        usdc_client.transfer(&env.current_contract_address(), &beneficiary, &usdc_amount);
        
        Ok(())
    }
}