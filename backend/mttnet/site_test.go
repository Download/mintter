package mttnet

import (
	"context"
	"mintter/backend/config"
	"mintter/backend/core/coretest"
	documents "mintter/backend/genproto/documents/v1alpha"
	siteproto "mintter/backend/genproto/documents/v1alpha"
	"mintter/backend/pkg/future"
	"mintter/backend/pkg/must"
	"mintter/backend/testutil"
	"mintter/backend/vcs/mttacc"
	vcsdb "mintter/backend/vcs/sqlitevcs"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestLocalPublish(t *testing.T) {
	t.Skip("not ready yet")
	t.Parallel()
	cfg := config.Default()
	cfg.Site.Hostname = "example.com"
	_, stopSite := makeTestPeer(t, "alice", cfg.Site)
	defer stopSite()
}

func TestMembers(t *testing.T) {
	t.Parallel()
	ownerSrv, docSrv, stopowner := makeTestSrv(t, "alice")
	owner, ok := ownerSrv.Node.Get()
	require.True(t, ok)
	defer stopowner()

	editorSrv, _, stopeditor := makeTestSrv(t, "bob")
	editor, ok := editorSrv.Node.Get()
	require.True(t, ok)
	defer stopeditor()

	readerSrv, _, stopreader := makeTestSrv(t, "david")
	reader, ok := readerSrv.Node.Get()
	require.True(t, ok)
	defer stopreader()

	cfg := config.Default()
	cfg.Site.Hostname = "127.0.0.1:55001"

	cfg.Site.OwnerID = owner.me.AccountID().String()
	siteSrv, _, stopSite := makeTestSrv(t, "carol", cfg.Site)
	site, ok := siteSrv.Node.Get()
	require.True(t, ok)
	defer stopSite()

	docSrv.SetSiteAccount(site.me.AccountID().String())

	ctx := context.Background()
	require.NoError(t, owner.Connect(ctx, site.AddrInfo()))
	header := metadata.New(map[string]string{string(MttHeader): cfg.Site.Hostname})
	ctx = metadata.NewIncomingContext(ctx, header) // Typically, the headers are written by the client in the outgoing context and server receives them in the incoming. But here we are writing the server directly
	ctx = context.WithValue(ctx, SiteAccountIDCtxKey, site.me.AccountID().String())
	res, err := ownerSrv.RedeemInviteToken(ctx, &siteproto.RedeemInviteTokenRequest{})
	require.NoError(t, err)
	require.Equal(t, documents.Member_OWNER, res.Role)
	token, err := ownerSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: time.Now().Add(10 * time.Minute).Unix()},
	})
	require.NoError(t, err)

	require.NoError(t, reader.Connect(ctx, site.AddrInfo()))
	_, err = readerSrv.RedeemInviteToken(ctx, &siteproto.RedeemInviteTokenRequest{})
	require.Error(t, err)

	require.NoError(t, editor.Connect(ctx, site.AddrInfo()))
	res, err = editorSrv.RedeemInviteToken(ctx, &siteproto.RedeemInviteTokenRequest{Token: token.Token})
	require.NoError(t, err)
	require.Equal(t, documents.Member_EDITOR, res.Role)
	_, err = editorSrv.GetMember(ctx, &siteproto.GetMemberRequest{AccountId: site.me.AccountID().String()})
	require.Error(t, err)
	member, err := editorSrv.GetMember(ctx, &siteproto.GetMemberRequest{AccountId: editor.me.AccountID().String()})
	require.NoError(t, err)
	require.Equal(t, editor.me.AccountID().String(), member.AccountId)
	require.Equal(t, documents.Member_EDITOR, member.Role)
	memberList, err := editorSrv.ListMembers(ctx, &siteproto.ListMembersRequest{})
	require.NoError(t, err)
	require.Len(t, memberList.Members, 2)
	_, err = editorSrv.DeleteMember(ctx, &siteproto.DeleteMemberRequest{AccountId: editor.me.AccountID().String()})
	require.Error(t, err)
	_, err = ownerSrv.DeleteMember(ctx, &siteproto.DeleteMemberRequest{AccountId: editor.me.AccountID().String()})
	require.NoError(t, err)
	_, err = editorSrv.ListMembers(ctx, &siteproto.ListMembersRequest{})
	require.Error(t, err)
	memberList, err = ownerSrv.ListMembers(ctx, &siteproto.ListMembersRequest{})
	require.NoError(t, err)
	require.Len(t, memberList.Members, 1)
	require.Equal(t, documents.Member_OWNER, memberList.Members[0].Role)
	require.Equal(t, owner.me.AccountID().String(), memberList.Members[0].AccountId)
}

func TestCreateTokens(t *testing.T) {
	t.Parallel()
	ownerSrv, docSrv, stopowner := makeTestSrv(t, "alice")
	owner, ok := ownerSrv.Node.Get()
	require.True(t, ok)
	defer stopowner()

	owner2Srv, _, stopowner2 := makeTestSrv(t, "alice-2")
	require.True(t, ok)
	defer stopowner2()

	editorSrv, _, stopeditor := makeTestSrv(t, "bob")

	require.True(t, ok)
	defer stopeditor()

	cfg := config.Default()
	cfg.Site.Hostname = "127.0.0.1:55001"

	cfg.Site.OwnerID = owner.me.AccountID().String()
	siteSrv, _, stopSite := makeTestSrv(t, "carol", cfg.Site)
	site, ok := siteSrv.Node.Get()
	require.True(t, ok)
	defer stopSite()

	docSrv.SetSiteAccount(site.me.AccountID().String())

	ctx := context.Background()
	tsFuture := time.Now().Add(48 * time.Hour).Unix()
	_, err := ownerSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})
	require.Error(t, err)

	_, err = siteSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})
	require.Error(t, err)
	require.NoError(t, owner.Connect(ctx, site.AddrInfo()))
	header := metadata.New(map[string]string{string(MttHeader): cfg.Site.Hostname})
	ctx = metadata.NewIncomingContext(ctx, header) // Typically, the headers are written by the client in the outgoing context and server receives them in the incoming. But here we are writing the server directly
	ctx = context.WithValue(ctx, SiteAccountIDCtxKey, site.me.AccountID().String())
	token, err := ownerSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})
	require.NoError(t, err)
	require.Equal(t, tsFuture, token.ExpireTime.Seconds)

	tsPast := time.Now().Add(-48 * time.Hour).Unix()
	_, err = ownerSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsPast},
	})
	require.Error(t, err)

	_, err = ownerSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_OWNER,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})
	require.Error(t, err)

	_, err = ownerSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_ROLE_UNSPECIFIED,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})
	require.NoError(t, err)

	_, err = editorSrv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})

	require.Error(t, err)

	_, err = owner2Srv.CreateInviteToken(ctx, &documents.CreateInviteTokenRequest{
		Role:       documents.Member_EDITOR,
		ExpireTime: &timestamppb.Timestamp{Seconds: tsFuture},
	})

	require.Error(t, err)
}

func TestSiteInfo(t *testing.T) {
	t.Parallel()
	ownerSrv, docSrv, stopowner := makeTestSrv(t, "alice")
	owner, ok := ownerSrv.Node.Get()
	require.True(t, ok)
	defer stopowner()

	cfg := config.Default()
	cfg.Site.Hostname = "127.0.0.1:55001"
	cfg.Site.Title = "My title"
	cfg.Site.OwnerID = owner.me.AccountID().String()
	siteSrv, _, stopSite := makeTestSrv(t, "bob", cfg.Site)
	site, ok := siteSrv.Node.Get()
	require.True(t, ok)
	defer stopSite()

	docSrv.SetSiteAccount(site.me.AccountID().String())

	ctx := context.Background()
	require.NoError(t, owner.Connect(ctx, site.AddrInfo()))
	header := metadata.New(map[string]string{string(MttHeader): cfg.Site.Hostname})
	ctx = metadata.NewIncomingContext(ctx, header) // Typically, the headers are written by the client in the outgoing context and server receives them in the incoming. But here we are writing the server directly
	ctx = context.WithValue(ctx, SiteAccountIDCtxKey, site.me.AccountID().String())
	res, err := ownerSrv.RedeemInviteToken(ctx, &siteproto.RedeemInviteTokenRequest{})
	require.NoError(t, err)
	require.Equal(t, documents.Member_OWNER, res.Role)

	//time.Sleep(100 * time.Millisecond)
	siteInfo, err := ownerSrv.GetSiteInfo(ctx, &documents.GetSiteInfoRequest{})
	require.NoError(t, err)
	require.Equal(t, cfg.Site.Hostname, siteInfo.Hostname)
	require.Equal(t, cfg.Site.OwnerID, siteInfo.Owner)
	require.Equal(t, cfg.Site.Title, siteInfo.Title)

	const newTitle = " new title"
	const newDescription = "new description"
	siteInfo, err = ownerSrv.UpdateSiteInfo(ctx, &siteproto.UpdateSiteInfoRequest{
		Title:       newTitle,
		Description: newDescription,
	})
	require.NoError(t, err)
	require.Equal(t, newDescription, siteInfo.Description)
	require.Equal(t, newTitle, siteInfo.Title)
	require.Equal(t, cfg.Site.Hostname, siteInfo.Hostname)
	require.Equal(t, owner.me.AccountID().String(), siteInfo.Owner)
	siteInfo, err = ownerSrv.GetSiteInfo(ctx, &documents.GetSiteInfoRequest{})
	require.NoError(t, err)
	require.Equal(t, newDescription, siteInfo.Description)
	require.Equal(t, newTitle, siteInfo.Title)
	require.Equal(t, cfg.Site.Hostname, siteInfo.Hostname)
	require.Equal(t, owner.me.AccountID().String(), siteInfo.Owner)
}

func makeTestSrv(t *testing.T, name string, siteCfg ...config.Site) (*Server, *simulatedDocs, context.CancelFunc) {
	u := coretest.NewTester(name)

	db := makeTestSQLite(t)

	hvcs := vcsdb.New(db)

	conn, release, err := hvcs.Conn(context.Background())
	require.NoError(t, err)
	reg, err := mttacc.Register(context.Background(), u.Account, u.Device, conn)
	release()
	require.NoError(t, err)
	cfg := config.Default()

	require.LessOrEqual(t, len(siteCfg), 1)
	if len(siteCfg) == 1 {
		cfg.Site = siteCfg[0]
	}

	cfg.HTTPPort = 0
	cfg.GRPCPort = 0
	cfg.RepoPath = testutil.MakeRepoPath(t)
	cfg.P2P.Port = 0
	cfg.P2P.BootstrapPeers = nil
	cfg.P2P.NoRelay = true
	cfg.P2P.NoMetrics = true

	n, err := New(cfg.P2P, hvcs, reg, u.Identity, must.Do2(zap.NewDevelopment()).Named(name))
	require.NoError(t, err)

	errc := make(chan error, 1)
	ctx, cancel := context.WithCancel(context.Background())
	f := future.New[*Node]()
	docsSrv := newSimulatedDocs(&siteproto.Publication{}, "")

	srv := NewServer(ctx, cfg.Site, f.ReadOnly, docsSrv, nil)
	require.NoError(t, f.Resolve(n))

	go func() {
		errc <- n.Start(ctx)
	}()

	t.Cleanup(func() {
		require.NoError(t, <-errc)
	})

	select {
	case <-n.Ready():
	case err := <-errc:
		require.NoError(t, err)
	}

	return srv, docsSrv, cancel
}

type simulatedDocs struct {
	siteAccount string
	publication *siteproto.Publication
}

func newSimulatedDocs(pub *siteproto.Publication, siteAccount string) *simulatedDocs {
	return &simulatedDocs{
		siteAccount: siteAccount,
		publication: pub,
	}
}

func (s *simulatedDocs) SetSiteAccount(acc string) {
	s.siteAccount = acc
}

func (s *simulatedDocs) GetPublication(ctx context.Context, in *siteproto.GetPublicationRequest) (*siteproto.Publication, error) {
	return s.publication, nil
}

func (s *simulatedDocs) GetSiteAccount(hostname string) (string, error) {
	return s.siteAccount, nil
}