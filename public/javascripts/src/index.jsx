var App = React.createClass({
	render: function render() {
		return (
			<div id="app">
				<div id="navigation">
					<NavigationList />
				</div>
				<SiteContent />
			</div>
		);
	}
});


React.render(
	<App />,
	document.getElementById("root")
);