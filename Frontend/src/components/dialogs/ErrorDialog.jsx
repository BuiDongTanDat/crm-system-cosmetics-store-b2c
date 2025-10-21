import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';

// ErrorDialog props:
export default function ErrorDialog({
	open = false,
	errors = 'Đã có lỗi xảy ra.',
	onClose = () => {},
	title = 'Lỗi',
}) {
	const renderContent = () => {
		if (!errors) return <p>Không có thông tin lỗi.</p>;

		if (typeof errors === 'string') {
			return <p style={{ margin: 0 }}>{errors}</p>;
		}

		// Array of messages
		if (Array.isArray(errors)) {
			return (
				<ul style={{ margin: 0, paddingLeft: 18 }}>
					{errors.map((err, i) => <li key={i}>{String(err)}</li>)}
				</ul>
			);
		}

		// Object - show pretty JSON and try to pick common fields
		try {
			// If it's an axios error shape, try to display message or response.data
			if (errors.response && (errors.response.data || errors.message)) {
				const resp = errors.response.data || errors.message;
				if (typeof resp === 'string') return <p style={{ margin: 0 }}>{resp}</p>;
				return <pre style={preStyle}>{JSON.stringify(resp, null, 2)}</pre>;
			}
		} catch (e) {
			// ignore
		}

		// Fallback: pretty print object
		return <pre style={preStyle}>{JSON.stringify(errors, null, 2)}</pre>;
	};

	return (
		<Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader className="flex items-start justify-between text-destructive">
					<div>
						<DialogTitle>{title}</DialogTitle>
					</div>
				</DialogHeader>

				<div className="mt-2 ">
					<DialogDescription asChild>
						<div className ="text-[16px]">{renderContent()}</div>
					</DialogDescription>
				</div>

				<DialogFooter className="mt-4">
					<Button
						onClick={onClose}
                        variant="outline"
					>
						Đóng
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// re-use some styles from ConfirmDialog or define new ones
const preStyle = {
	background: '#f7f7f7',
	padding: 10,
	borderRadius: 4,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	margin: 0,
};
