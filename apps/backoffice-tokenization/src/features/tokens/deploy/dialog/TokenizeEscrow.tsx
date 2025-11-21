import * as React from "react";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { TokenizeEscrowSuccessDialog } from "./TokenizeEscrowSuccessDialog";
import { useTokenizeEscrow } from "./useTokenizeEscrow";

export const TokenizeEscrowDialog = () => {
	const [open, setOpen] = React.useState(false);
	const [openSuccess, setOpenSuccess] = React.useState(false);

	const { form, isSubmitting, error, response, setResponse, handleSubmit } =
		useTokenizeEscrow({
			onSuccess: () => {
				setOpen(false);
				setOpenSuccess(true);
			},
		});

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button variant="outline" type="button" className="cursor-pointer w-full">
						Tokenize Escrow
					</Button>
				</DialogTrigger>
				<DialogContent className="!w-full sm:!max-w-lg max-h-[95vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Tokenize Escrow</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={handleSubmit} className="flex flex-col space-y-6">
							<FormField
								control={form.control}
								name="escrowId"
								rules={{ required: "Escrow ID is required" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center">
											Escrow ID<span className="text-destructive ml-1">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter escrow contract ID"
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{error ? (
								<p className="text-sm text-destructive" role="alert">
									{error}
								</p>
							) : null}

							<Button className="w-full cursor-pointer" type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<div className="flex items-center justify-center">
										<Loader2 className="h-5 w-5 animate-spin" />
										<span className="ml-2">Deploying...</span>
									</div>
								) : (
									"Deploy Token"
								)}
							</Button>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<TokenizeEscrowSuccessDialog
				open={openSuccess}
				onOpenChange={(nextOpen) => {
					setOpenSuccess(nextOpen);
					if (!nextOpen) {
						setResponse(null);
					}
				}}
				response={response}
			/>
		</>
	);
};


