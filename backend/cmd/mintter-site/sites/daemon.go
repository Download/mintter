package sites

import (
	"context"
	"errors"
	"fmt"
	"mintter/backend/config"
	"mintter/backend/core"
	"mintter/backend/daemon"
	"mintter/backend/daemon/storage"
	accounts "mintter/backend/genproto/accounts/v1alpha"
	"mintter/backend/ipfs"
	"mintter/backend/mttnet"
	"mintter/backend/pkg/future"
	"mintter/backend/pkg/must"
	"net/url"

	"crawshaw.io/sqlite/sqlitex"
)

// App is the site daemon app.
type App struct {
	*daemon.App

	Website *Website
	Address *url.URL
	Config  config.Config
}

// Load the site daemon.
func Load(ctx context.Context, address string, cfg config.Config, dir *storage.Dir) (*App, error) {
	u, err := url.Parse(address)
	if err != nil {
		return nil, fmt.Errorf("failed to parse address: %w", err)
	}

	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("address URL only supports http or https: got %q", address)
	}

	if u.Path != "" {
		return nil, fmt.Errorf("address URL must not have a path: %s", address)
	}

	cfg.P2P.AnnounceAddrs = must.Do2(
		ipfs.ParseMultiaddrs(
			ipfs.DefaultListenAddrsDNS(u.Hostname(), cfg.P2P.Port)))

	nf := future.New[*mttnet.Node]()
	ndb := future.New[*sqlitex.Pool]()
	site := NewServer(address, nf.ReadOnly, ndb.ReadOnly)

	app, err := daemon.Load(ctx, cfg, dir, site, daemon.GenericHandler{
		Path:    "/.well-known/hypermedia-site",
		Handler: site,
		Mode:    daemon.RouteNav,
	})
	if err != nil {
		return nil, err
	}

	// This is some ugly stuff. Site server needs some stuff that are passed from the daemon.
	go func() {
		if err := ndb.Resolve(app.DB); err != nil {
			panic(err)
		}

		node, err := app.Net.Await(ctx)
		if err != nil && !errors.Is(err, context.Canceled) {
			panic(err)
		}

		if err := nf.Resolve(node); err != nil {
			panic(err)
		}
	}()

	if _, ok := dir.Identity().Get(); !ok {
		account, err := core.NewKeyPairRandom()
		if err != nil {
			return nil, fmt.Errorf("failed to generate random account key pair: %w", err)
		}

		if err := app.RPC.Daemon.RegisterAccount(ctx, account); err != nil {
			return nil, fmt.Errorf("failed to create registration: %w", err)
		}
	}

	if _, err := app.RPC.Accounts.UpdateProfile(ctx, &accounts.Profile{
		Alias: address,
		Bio:   "Hypermedia Site. Powered by Mintter.",
	}); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	setupURL := site.GetSetupURL(ctx)

	fmt.Println("Site Invitation secret token: " + setupURL)

	return &App{
		App:     app,
		Website: site,
		Address: u,
		Config:  cfg,
	}, nil
}