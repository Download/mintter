package mttdoc

import (
	"mintter/backend/vcs/vcsdb"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDocumentSmoke(t *testing.T) {
	doc := New(vcsdb.MakeDatomFactory(1, 1, 0))

	require.True(t, doc.MoveBlock("b1", "", ""))
	require.False(t, doc.MoveBlock("b1", "", ""))
	require.False(t, doc.MoveBlock("b1", "", ""))
	require.Len(t, doc.dirtyDatoms, 4, doc.err)

	require.True(t, doc.MoveBlock("b2", "", "b1"))
	require.False(t, doc.MoveBlock("b2", "", "b1"))
	require.Len(t, doc.dirtyDatoms, 8, doc.err)

	require.True(t, doc.MoveBlock("b2", "b1", ""), doc.err)
	require.Len(t, doc.dirtyDatoms, 12, doc.err)

	require.NoError(t, doc.err)

	testHierarchy(t, []contentBlockPosition{
		{"b1", "$ROOT", ""},
		{"b2", "b1", ""},
	}, doc)
}

func TestModeAncestor(t *testing.T) {
	doc := New(vcsdb.MakeDatomFactory(1, 1, 0))

	require.True(t, doc.MoveBlock("b1", "", ""))
	require.True(t, doc.MoveBlock("b2", "", "b1"))
	require.True(t, doc.MoveBlock("b2", "b1", ""))
	require.False(t, doc.MoveBlock("b1", "b2", ""))
	require.Error(t, doc.err)
}

func TestReplicate(t *testing.T) {
	doc := New(vcsdb.MakeDatomFactory(1, 1, 0))

	/*
		- b1
		- b3
			- b2
			- b4
	*/
	require.True(t, doc.MoveBlock("b1", "", ""))
	require.True(t, doc.MoveBlock("b2", "", "b1"))
	require.True(t, doc.MoveBlock("b3", "", "b1"))
	require.True(t, doc.MoveBlock("b2", "b3", ""))
	require.True(t, doc.MoveBlock("b4", "b3", "b2"))
	require.Len(t, doc.dirtyDatoms, 5*4, doc.err)

	want := []contentBlockPosition{
		{"b1", "$ROOT", ""},
		{"b3", "$ROOT", "b1"},
		{"b2", "b3", ""},
		{"b4", "b3", "b2"},
	}

	testHierarchy(t, want, doc)

	r := New(vcsdb.MakeDatomFactory(1, 1, doc.lastOp.Seq))
	require.NoError(t, r.Replay(doc.dirtyDatoms))

	testHierarchy(t, want, r)
}

func TestDeleteBlock(t *testing.T) {
	doc := New(vcsdb.MakeDatomFactory(1, 1, 0))

	/*
		- b1
		- b3
			x b2
			- b4
	*/
	require.True(t, doc.MoveBlock("b1", "", ""))
	require.True(t, doc.MoveBlock("b2", "", "b1"))
	require.True(t, doc.MoveBlock("b3", "", "b1"))
	require.True(t, doc.MoveBlock("b2", "b3", ""))
	require.True(t, doc.MoveBlock("b4", "b3", "b2"))
	require.True(t, doc.DeleteBlock("b2"), doc.err)
	require.Len(t, doc.dirtyDatoms, 6*4, doc.err)

	want := []contentBlockPosition{
		{"b1", "$ROOT", ""},
		{"b3", "$ROOT", "b1"},
		{"b4", "b3", ""},
	}

	testHierarchy(t, want, doc)
}

func TestComplexWithMode(t *testing.T) {
	t.Parallel()

	doc := New(vcsdb.MakeDatomFactory(1, 1, 0))

	doc.MoveBlock("b1", "", "")
	doc.MoveBlock("b1.1", "b1", "")
	doc.MoveBlock("b2", "", "")
	doc.MoveBlock("b1.1", "", "b2")
	doc.DeleteBlock("b1.1")

	require.NoError(t, doc.Err())

	r := New(vcsdb.MakeDatomFactory(1, 1, 0))
	require.NoError(t, r.Replay(doc.DirtyDatoms()))
}