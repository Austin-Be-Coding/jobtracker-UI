
import React, { useEffect, useRef, useState } from "react";
import * as userService from './userService'
import '../styles/main.css'

export default function CreateUser({ onUserCreated } = {}) {
	const [phase, setPhase] = useState("intro");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [userName, setUserName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [profilePictureURL, setProfilePictureURL] = useState("");
	const fileInputRef = useRef(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const t1 = setTimeout(() => setPhase("butFirst"), 1200);
		const t2 = setTimeout(() => setPhase("prompt"), 2500);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, []);

	function clearForm() {
		setFirstName("");
		setLastName("");
		setUserName("");
		setEmail("");
		setPassword("");
		setConfirmPassword("");
		setError("");
		setProfilePictureURL("");
		setPhase("intro");
	}

	function triggerFileSelect() {
		if (fileInputRef.current) fileInputRef.current.click();
	}

	function handleFileChange(e) {
		const f = e.target.files && e.target.files[0];
		if (!f) return;
		if (!f.type.startsWith('image/')) return;

		// read file as data URL
		const reader = new FileReader();
		reader.onload = async () => {
			try {
				const img = new Image();
				img.src = reader.result;
				await new Promise((res, rej) => {
					img.onload = res;
					img.onerror = rej;
				});

				// downscale to max 200px
				const MAX_DIM = 200;
				let { width, height } = img;
				if (width > MAX_DIM || height > MAX_DIM) {
					const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
					width = Math.round(width * ratio);
					height = Math.round(height * ratio);
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0, width, height);

				// compress to JPEG at 0.7 quality
				const compressed = canvas.toDataURL('image/jpeg', 0.7);
				setProfilePictureURL(compressed);
			} catch (err) {
				// fallback: use original data URL
				setProfilePictureURL(reader.result.toString());
			}
		};
		reader.readAsDataURL(f);
	}

	function togglePasswordVisibility() {
		setShowPassword((s) => !s);
	}

	function validate() {
		if (!firstName.trim()) return "First name is required";
		if (!lastName.trim()) return "Last name is required";
		if (!userName.trim()) return "Username is required";
		if (!email.trim()) return "Email is required";
		if (!password) return "Password is required";
		if (password !== confirmPassword) return "Passwords do not match";
		return "";
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const v = validate();
		if (v) {
			setError(v);
			return;
		}
		setError("");
		setLoading(true);
		const payload = { firstName: firstName.trim(), lastName: lastName.trim(), userName: userName.trim(), email: email.trim(), password, profilePictureURL };
		try {
			const created = await userService.createUser(payload);
			setPhase("saved");
			if (typeof onUserCreated === "function") onUserCreated(created || payload);
		} catch (err) {
			setError(err?.message || 'Failed to create user');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ maxWidth: 520, margin: "2rem auto", padding: 16, textAlign: "center" }}>
			{phase === "intro" && (
				<div>
					<h2 className="gradient-heading" >Hey! Let's get you working...</h2>
				</div>
			)}

			{phase === "butFirst" && (
				<div>
					<h2 className="gradient-heading">But first, tell me about your self</h2>
				</div>
			)}

			{phase === "prompt" && (
				<div className="prompt">
					<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
					<div onClick={triggerFileSelect} role="button" aria-label="Upload profile picture" className="avatar-upload" style={{ backgroundImage: profilePictureURL ? `url(${profilePictureURL})` : 'none' }}>
						{!profilePictureURL && <span style={{ fontSize: 36, color: '#666' }}>+</span>}
					</div>
					{error && <div className="error">{error}</div>}
					<form onSubmit={handleSubmit} className="form-container">
						<div className="form-grid">
						<input
							placeholder="First name"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							className="input-field" style={{ flex: 1 }}
						/>
						<input
							placeholder="Last name"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							className="input-field" style={{ flex: 1 }}
						/>
					</div>

					<input
						placeholder="Username"
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						className="input-field"
					/>

					<input
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="input-field"
						type="email"
					/>

					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<input
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="input-field" style={{ flex: 1 }}
							type={showPassword ? "text" : "password"}
						/>
						<input
							placeholder="Confirm password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="input-field" style={{ flex: 1 }}
							type={showPassword ? "text" : "password"}
						/>
						<button type="button" onClick={togglePasswordVisibility} className="btn btn-secondary" aria-label="Toggle password visibility">
							{showPassword ? '🙈' : '👁️'}
						</button>
					</div>

						<div className="form-actions">
						<button type="submit" className="cta-button">
							Save
						</button>
						<button type="button" onClick={clearForm} className="btn btn-secondary">
							Reset
						</button>
					</div>
					</form>
				</div>
			)}

			{phase === "saved" && (
				<div>
					<h2>Nice to meet you, {firstName}!</h2>
					<button onClick={clearForm} style={{ padding: "6px 10px", cursor: "pointer" }}>
						Change details
					</button>
				</div>
			)}
		</div>
	);
}

